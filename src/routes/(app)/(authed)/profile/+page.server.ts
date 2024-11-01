import { AUTH_COOKIE } from '$lib/server/auth.js';
import prisma from '$lib/server/prisma.js';
import { ROLE, type GradientAngleType } from '$lib/shared/consts.js';
import { isObjectEqual } from '$lib/utils';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

const MAX_LISTENS = 25;

export const load = async ({ locals, depends }) => {
  depends('listened');
  const ownerTheme = await prisma.theme.findFirst({ where: { user: { role: ROLE.OWNER } } });
  const listens = await prisma.listened.findMany({
    where: { userId: locals.user?.id },
    select: {
      id: true,
      updatedAt: true,
      listeningTime: true,
      track: {
        select: {
          id: true,
          title: true,
          length: true,
          trackNumber: true,
          artists: { select: { name: true, id: true } },
          album: {
            select: {
              id: true,
              title: true,
              albumArtist: { select: { name: true, id: true } },
              albumArtId: true,
              albumArtAccent: true,
              albumArt: true,
              tracks: {
                select: { id: true, title: true, artists: { select: { name: true, id: true } } }
              }
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: MAX_LISTENS
  });

  const totalListens = await prisma.listened.count({ where: { userId: locals.user?.id } });

  const totalListeningTime = await prisma.listened.aggregate({
    where: { userId: locals.user?.id },
    _sum: { listeningTime: true }
  });

  return {
    title: 'Profile',
    ownerTheme,
    listens,
    totalListens,
    totalListeningTime: totalListeningTime._sum.listeningTime
  };
};

export const actions = {
  update: async ({ request, locals }) => {
    const form = await request.formData();
    const username = form.get('username')?.toString();
    const email = form.get('email')?.toString();

    if (!username || !email || !locals.user) {
      return fail(400, { error: 'Username and email required!' });
    }

    const user = await prisma.user.update({
      where: { id: locals.user.id },
      data: { username, email }
    });

    return {
      message: 'Profile updated',
      user: {
        username: user.username,
        email: user.email
      }
    };
  },
  changepassword: async ({ request, locals, cookies }) => {
    const form = await request.formData();
    const password = form.get('currentpassword')?.toString();
    const newpassword = form.get('newpassword')?.toString();
    const repeatpassword = form.get('repeatpassword')?.toString();

    if (!password || !newpassword || !locals.user || !repeatpassword) {
      return fail(400, {
        error: 'Password, new password, and repeat password required!',
        action: 'changepassword'
      });
    }

    if (newpassword !== repeatpassword) {
      return fail(400, {
        error: 'New password and repeat password must match!',
        action: 'changepassword'
      });
    }

    if (newpassword === password) {
      return fail(400, {
        error: 'New password must be different from current password!',
        action: 'changepassword'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: locals.user.id }
    });

    if (!user) {
      return fail(400, { error: 'User not found!', action: 'changepassword' });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return fail(400, { error: 'Current password is incorrect!', action: 'changepassword' });
    }

    const newHash = await bcrypt.hash(newpassword, 10);

    await prisma.user.update({
      where: { id: locals.user.id },
      data: { password: newHash }
    });

    cookies.delete(AUTH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production',
      sameSite: 'strict',
      path: '/'
    });

    return {
      message: 'Password updated'
    };
  },
  updatetheme: async ({ request, locals }) => {
    const form = await request.formData();

    const primary = form.get('accent')?.toString();
    const rounding = form.get('rounding')?.toString();
    const gradientStart = form.get('startcolor')?.toString();
    const gradientMiddle = form.get('middlecolor')?.toString();
    const gradientEnd = form.get('endcolor')?.toString();
    const gradientMiddlePoint = form.get('middlepoint')?.toString();
    const gradientAngle = form.get('angle')?.toString();

    if (
      !primary ||
      !rounding ||
      !gradientStart ||
      !gradientMiddle ||
      !gradientEnd ||
      !gradientMiddlePoint ||
      !gradientAngle
    ) {
      return fail(400, { error: 'All fields are required!' });
    }

    if (isNaN(parseInt(rounding)) || parseInt(rounding) < 0 || parseInt(rounding) > 64) {
      return fail(400, { error: 'Rounding must be a number between 0 and 64!' });
    }

    const themeForm = {
      primary,
      rounding: parseInt(rounding),
      gradientStart,
      gradientMiddle,
      gradientEnd,
      gradientMiddlePoint: parseInt(gradientMiddlePoint),
      gradientAngle: gradientAngle.replaceAll(' ', '_') as GradientAngleType
    };

    let theme;

    // If the user is not the owner and the new theme is the owner's then delete the user's theme
    if (locals.user?.role !== ROLE.OWNER) {
      const ownerTheme = await prisma.theme.findFirst({
        where: { user: { role: ROLE.OWNER } },
        select: {
          primary: true,
          rounding: true,
          gradientStart: true,
          gradientMiddle: true,
          gradientEnd: true,
          gradientMiddlePoint: true,
          gradientAngle: true
        }
      });

      if (isObjectEqual(ownerTheme, themeForm)) {
        await prisma.theme.deleteMany({ where: { userId: locals.user?.id } });
        return {
          message: 'Theme updated',
          theme: ownerTheme
        };
      }
    }

    // If the user has a theme then update it, otherwise create a new one
    if (locals.user?.themes && locals.user?.themes.length > 0) {
      theme = await prisma.theme.update({
        where: { id: locals.user.themes[0].id },
        data: themeForm
      });
    } else if (locals.user) {
      theme = await prisma.theme.create({
        data: {
          ...themeForm,
          user: { connect: { id: locals.user.id } }
        }
      });
    } else {
      return fail(400, { error: 'User not found!' });
    }

    return {
      message: 'Theme updated',
      theme
    };
  },
  delete: async ({ locals, cookies }) => {
    if (!locals.user) {
      return fail(400, { error: 'User not found!' });
    }

    if (locals.user.role === ROLE.OWNER) {
      return fail(400, { error: 'Owner cannot be deleted!' });
    }

    await prisma.user.delete({
      where: { id: locals.user.id }
    });

    cookies.delete(AUTH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production',
      sameSite: 'strict',
      path: '/'
    });

    return {
      message: 'User deleted'
    };
  },
  getListens: async ({ locals, request }) => {
    const formData = await request.formData();
    const skip = formData.get('from')?.toString();

    const listens = await prisma.listened.findMany({
      where: { userId: locals.user?.id },
      skip: skip ? parseInt(skip) : 0,
      select: {
        id: true,
        updatedAt: true,
        listeningTime: true,
        track: {
          select: {
            id: true,
            title: true,
            length: true,
            trackNumber: true,
            artists: { select: { name: true, id: true } },
            album: {
              select: {
                id: true,
                title: true,
                albumArtist: { select: { name: true, id: true } },
                albumArtId: true,
                albumArtAccent: true,
                albumArt: true,
                tracks: {
                  select: { id: true, title: true, artists: { select: { name: true, id: true } } }
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: MAX_LISTENS
    });

    return {
      listens
    };
  }
};

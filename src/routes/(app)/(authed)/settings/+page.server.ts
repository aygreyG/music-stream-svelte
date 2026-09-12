import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

import { AUTH_COOKIE } from '$lib/server/auth.js';
import prisma from '$lib/server/prisma.js';
import { ROLE } from '$lib/shared/consts.js';

export const load = async () => {
  return {
    title: 'Settings'
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

    return redirect(303, '/login');
  }
};

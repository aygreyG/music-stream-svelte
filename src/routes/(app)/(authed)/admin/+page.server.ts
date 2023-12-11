import { register } from '$lib/server/auth.js';
import prisma from '$lib/server/prisma.js';
import { fail } from '@sveltejs/kit';

export const actions = {
  create: async ({ request, locals }) => {
    if (locals.user?.role === 'USER') {
      return fail(403, { error: 'You must be an admin to access this page' });
    }

    const form = await request.formData();
    const email = form.get('email')?.toString();
    const username = form.get('username')?.toString();
    const password = form.get('password')?.toString();
    const admin = form.get('admin')?.toString() === 'on';

    if (!email || !username || !password) {
      return fail(400, { error: 'Email, username, password required!' });
    }

    try {
      await register(email, password, password, username, admin ? 'ADMIN' : 'USER');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return fail(400, { error: err?.message });
    }

    return {
      success: true
    };
  },
  update: async ({ request, locals }) => {
    if (locals.user?.role === 'USER') {
      return fail(403, { error: 'You must be an admin to access this page' });
    }

    const form = await request.formData();
    const id = form.get('id')?.toString();
    const email = form.get('email')?.toString();
    const username = form.get('username')?.toString();
    const admin = form.get('admin')?.toString() === 'on';

    if (!id || !email || !username) {
      return fail(400, { error: 'Id, email, username required!' });
    }

    const userWithEmail = await prisma.user.findUnique({ where: { email, AND: { NOT: { id } } } });
    const userWithUsername = await prisma.user.findUnique({
      where: { username, AND: { NOT: { id } } }
    });

    if (userWithEmail || userWithUsername) {
      return fail(400, { error: `user already exists: ${userWithEmail ? 'email' : 'username'}` });
    }

    try {
      await prisma.user.update({
        where: {
          id
        },
        data: {
          email,
          username,
          role: admin ? 'ADMIN' : 'USER'
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return fail(400, { error: "Couldn't update user" });
    }

    return {
      success: true
    };
  },
  delete: async ({ request, locals }) => {
    if (locals.user?.role === 'USER') {
      return fail(403, { error: 'You must be an admin to access this page' });
    }

    const form = await request.formData();
    const id = form.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'id is required' });
    }

    try {
      await prisma.user.delete({
        where: {
          id,
          AND: {
            NOT: {
              role: 'OWNER'
            }
          }
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return fail(400, { error: "Couldn't delete user" });
    }

    return {
      success: true
    };
  }
};

export const load = async ({ locals }) => {
  if (locals.user?.role === 'USER') {
    return fail(403, { error: 'You must be an admin to access this page' });
  }

  const users = await prisma.user.findMany({
    where: { id: { not: locals.user?.id }, AND: { NOT: { role: 'OWNER' } } },
    select: { id: true, email: true, username: true, role: true, createdAt: true, updatedAt: true }
  });

  return {
    user: locals.user,
    users
  };
};

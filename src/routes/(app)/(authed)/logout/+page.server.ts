import { redirect, type Actions } from '@sveltejs/kit';

import { AUTH_COOKIE } from '$lib/server/auth';

export async function load() {
  redirect(307, '/');
}

export const actions: Actions = {
  default: async ({ cookies }) => {
    cookies.delete(AUTH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production',
      sameSite: 'strict',
      path: '/'
    });

    redirect(303, '/login');
  }
};

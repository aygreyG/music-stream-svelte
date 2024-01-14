import { AUTH_COOKIE } from '$lib/server/auth';
import { redirect, type Actions } from '@sveltejs/kit';

export async function load() {
  redirect(307, '/');
}

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    cookies.delete(AUTH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production',
      sameSite: 'strict',
      path: '/'
    });

    const referer = request.headers.get('referer');

    redirect(303, referer ?? '/');
  }
};

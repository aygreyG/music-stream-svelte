import { AUTH_COOKIE, login } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load = ({ request, url }) => {
  const referer = url.searchParams.get('redirect_to') || request.headers.get('referer');

  let redirectTo = null;

  // Check if referer is from same site or starts with '/'
  // if same site => check if it is same page
  if (referer?.startsWith(url.origin) && !referer.startsWith(url.href)) {
    redirectTo = encodeURIComponent(referer);
  } else if (referer?.startsWith('/')) {
    redirectTo = encodeURIComponent(url.origin + referer);
  }

  return {
    redirectTo
  };
};

export const actions = {
  default: async ({ request, cookies, url }) => {
    const form = await request.formData();

    const username = form.get('username')?.toString();
    const password = form.get('password')?.toString();

    if (!username || !password) {
      return fail(401, {
        error: 'username and password are required'
      });
    }

    try {
      const data = await login(username, password);

      cookies.set(AUTH_COOKIE, data.token, {
        maxAge: data.maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV == 'production',
        sameSite: 'strict'
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return fail(401, {
        error: err?.message
      });
    }

    const refer = url.searchParams.get('redirect_to');

    throw redirect(303, refer ? refer : '/');
  }
};

import { AUTH_COOKIE } from '$lib/server/auth';
import { redirect, type Actions } from '@sveltejs/kit';

export async function load() {
	throw redirect(307, '/');
}

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		cookies.delete(AUTH_COOKIE, {
			httpOnly: true,
			secure: process.env.NODE_ENV == 'production',
			sameSite: 'strict'
		});

		const referer = request.headers.get('referer');

		throw redirect(303, referer ?? '/');
	}
};

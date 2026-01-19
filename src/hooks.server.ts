import { env } from '$env/dynamic/private';
import { AUTH_COOKIE, validateToken } from '$lib/server/auth';
import { runLibrarySync } from '$lib/server/librarySync';
import { getServerSettings } from '$lib/server/serverSettings';
import { serverLog } from '$lib/server/utils';
import { ROLE } from '$lib/shared/consts';
import { redirect, type Handle } from '@sveltejs/kit';

let startupRunning = false;

async function runOnStartup() {
  if (startupRunning) {
    return;
  }

  startupRunning = true;
  const serverSettings = await getServerSettings();

  if (!serverSettings || !serverSettings?.setupComplete) {
    startupRunning = false;
    return;
  }

  if (env.NODE_ENV === 'production') {
    runLibrarySync();
  }

  startupRunning = false;

  return;
}

const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  const serverSettings = await getServerSettings();
  if (startupRunning && !event.route.id?.startsWith('/loading')) {
    redirect(303, '/loading');
  }

  if (
    (!serverSettings || !serverSettings?.setupComplete) &&
    !event.route.id?.startsWith('/setup') &&
    !event.route.id?.startsWith('/api/folder') &&
    !startupRunning
  ) {
    redirect(303, '/setup');
  }

  if (
    (event.route.id?.startsWith('/setup') || event.route.id?.startsWith('/loading')) &&
    serverSettings?.setupComplete &&
    !startupRunning
  ) {
    redirect(303, '/');
  }

  event.locals.serverSettings = serverSettings;
  const authToken = event.cookies.get(AUTH_COOKIE);

  if (authToken) {
    try {
      const { user, refreshedToken } = await validateToken(authToken);
      event.locals.user = user;

      // If token was refreshed, update the cookie
      if (refreshedToken) {
        event.cookies.set(AUTH_COOKIE, refreshedToken.token, {
          path: '/',
          maxAge: refreshedToken.maxAge,
          httpOnly: true,
          sameSite: 'strict',
          secure: true
        });
      }
    } catch {
      event.locals.user = null;
      event.cookies.delete(AUTH_COOKIE, { path: '/' });
    }
  }

  if (event.route.id?.startsWith('/(app)/(unauthed)') && event.locals.user) {
    redirect(303, '/');
  }

  if (event.route.id?.startsWith('/(app)/(authed)') && !event.locals.user) {
    redirect(303, `/login?redirect_to=${event.url.pathname}${event.url.search}`);
  }

  if (
    (event.route.id?.startsWith('/(app)/(authed)/admin') ||
      event.route.id?.startsWith('/(app)/(authed)/api/admin')) &&
    (!event.locals.user || event.locals.user.role === ROLE.USER)
  ) {
    redirect(303, '/');
  }

  // Check if request has cacheKey and if it is the same as serverSettings cacheKey
  try {
    const cacheKey = event.request.headers.get('cache-key');
    if (serverSettings && cacheKey && BigInt(cacheKey) === serverSettings.cacheKey) {
      return new Response(null, { status: 304 });
    }
  } catch (e) {
    serverLog(`Error checking cache key: ${e}`, 'warn');
  }

  const response = await resolve(event);
  const end = Date.now();
  const responseTime = end - start;
  let message = `Response: ${event.route.id}`;
  const params = Object.keys(event.params);

  if (params.length > 0) {
    // @ts-expect-error This actually works, key is always one of the params and not just a string
    message += ` ${params.map((key) => `${key}:${event.params[key]}`).join(', ')}`;
  }

  serverLog(`${message} | ${responseTime}ms`);

  return response;
};

export { handle };

runOnStartup();

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

  const authToken = event.cookies.get(AUTH_COOKIE);

  if (authToken) {
    try {
      const user = await validateToken(authToken);
      event.locals.user = user;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
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

  const response = await resolve(event);
  const end = Date.now();
  const responseTime = end - start;
  let message = `Response: ${event.route.id}`;
  const params = Object.keys(event.params);

  if (params.length > 0) {
    message += ` ${params.map((key) => `${key}:${event.params[key]}`).join(', ')}`;
  }

  serverLog(`${message} | ${responseTime}ms`);

  return response;
};

export { handle };

runOnStartup();

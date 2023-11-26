import { NODE_ENV } from '$env/static/private';
import { AUTH_COOKIE, validateToken } from '$lib/server/auth';
import { runLibrarySync } from '$lib/server/librarySync';
import prisma from '$lib/server/prisma';
import { getServerSettings } from '$lib/server/serverSettings';
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

  if (NODE_ENV === 'production') {
    runLibrarySync();
  }

  startupRunning = false;

  return;
}

const handle: Handle = async ({ event, resolve }) => {
  console.log(event.route.id);
  const serverSettings = await getServerSettings();
  if (startupRunning && !event.route.id?.startsWith('/loading')) {
    throw redirect(303, '/loading');
  }

  if (
    (!serverSettings || !serverSettings?.setupComplete) &&
    !event.route.id?.startsWith('/setup') &&
    !startupRunning
  ) {
    throw redirect(303, '/setup');
  }

  if (
    (event.route.id?.startsWith('/setup') || event.route.id?.startsWith('/loading')) &&
    serverSettings?.setupComplete &&
    !startupRunning
  ) {
    throw redirect(303, '/');
  }

  const authToken = event.cookies.get(AUTH_COOKIE);

  if (authToken) {
    try {
      const user = await validateToken(authToken);
      event.locals.user = user;
    } catch (err) {
      event.locals.user = null;
      event.cookies.delete(AUTH_COOKIE);
    }
  }

  if (event.route.id?.startsWith('/(unauthed)/') && event.locals.user) {
    throw redirect(303, '/');
  }

  if (event.route.id?.startsWith('/(authed)/') && !event.locals.user) {
    throw redirect(303, `/login?redirect_to=${event.url.pathname}${event.url.search}`);
  }

  if (
    (event.route.id?.startsWith('/(authed)/admin') || event.route.id?.startsWith('/api/')) &&
    !(event.locals.user && event.locals.user.admin)
  ) {
    throw redirect(303, '/');
  }

  return await resolve(event);
};

export { handle };

runOnStartup();

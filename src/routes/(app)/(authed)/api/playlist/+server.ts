import { json } from '@sveltejs/kit';

import prisma from '$lib/server/prisma.js';
import { updateCacheKey } from '$lib/server/serverSettings.js';

export const POST = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const name = body.name;
  const trackId = body.trackId;

  if (!name) {
    return new Response('Missing name', { status: 400 });
  }

  const playlist = await prisma.playlist.create({
    data: {
      name,
      user: { connect: { id: locals.user.id } },
      ...(trackId ? { tracks: { connect: { id: trackId } } } : {})
    }
  });

  await updateCacheKey();

  return json({ playlist });
};

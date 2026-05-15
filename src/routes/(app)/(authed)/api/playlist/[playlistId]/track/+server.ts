import { json } from '@sveltejs/kit';

import prisma from '$lib/server/prisma.js';
import { updateCacheKey } from '$lib/server/serverSettings.js';

export const POST = async ({ params, request, locals }) => {
  const { playlistId } = params;

  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const trackId = body.trackId;

  if (!trackId) {
    return new Response('Missing trackId', { status: 400 });
  }

  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, userId: locals.user.id }
  });

  if (!playlist) {
    return new Response('Playlist not found', { status: 404 });
  }

  await prisma.playlist.update({
    where: { id: playlistId },
    data: {
      tracks: { connect: { id: trackId } }
    }
  });

  await updateCacheKey();

  return json({ success: true });
};

export const DELETE = async ({ params, request, locals }) => {
  const { playlistId } = params;

  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const trackId = body.trackId;

  if (!trackId) {
    return new Response('Missing trackId', { status: 400 });
  }

  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, userId: locals.user.id }
  });

  if (!playlist) {
    return new Response('Playlist not found', { status: 404 });
  }

  await prisma.playlist.update({
    where: { id: playlistId },
    data: {
      tracks: { disconnect: { id: trackId } }
    }
  });

  await updateCacheKey();

  return json({ success: true });
};

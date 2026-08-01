import { json } from '@sveltejs/kit';

import { getLyricsForTrack } from '$lib/server/lyrics.js';
import prisma from '$lib/server/prisma.js';

export const GET = async ({ params, url, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { trackId } = params;
  const force = url.searchParams.get('force') === 'true';
  const userId = locals.user.id;

  const [result, delayRow] = await Promise.all([
    getLyricsForTrack(trackId, force),
    prisma.userTrackLyricsDelay.findUnique({
      where: { userId_trackId: { userId, trackId } },
      select: { delay: true }
    })
  ]);

  if (!result.found) {
    return new Response('Not Found', { status: 404 });
  }

  return json({
    plainLyrics: result.plainLyrics,
    syncedLyrics: result.syncedLyrics,
    instrumental: result.instrumental,
    delay: delayRow?.delay ?? 0
  });
};

export const PUT = async ({ params, locals, request }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { trackId } = params;
  const userId = locals.user.id;
  const body = await request.json();
  const delay = Math.round(Number(body.delay) * 10) / 10;

  if (!Number.isFinite(delay)) {
    return new Response('Invalid delay', { status: 400 });
  }

  if (delay === 0) {
    await prisma.userTrackLyricsDelay.deleteMany({ where: { userId, trackId } });
  } else {
    await prisma.userTrackLyricsDelay.upsert({
      where: { userId_trackId: { userId, trackId } },
      create: { userId, trackId, delay },
      update: { delay }
    });
  }

  return json({ delay });
};

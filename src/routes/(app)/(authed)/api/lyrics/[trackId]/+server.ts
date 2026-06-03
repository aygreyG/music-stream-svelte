import { json } from '@sveltejs/kit';

import { getLyricsForTrack } from '$lib/server/lyrics.js';

export const GET = async ({ params, url, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { trackId } = params;
  const force = url.searchParams.get('force') === 'true';
  const result = await getLyricsForTrack(trackId, force);

  if (!result.found) {
    return new Response('Not Found', { status: 404 });
  }

  return json({
    plainLyrics: result.plainLyrics,
    syncedLyrics: result.syncedLyrics,
    instrumental: result.instrumental
  });
};

import prisma from '$lib/server/prisma.js';
import { searchForAlbumRelease } from '$lib/shared/fetchAlbumArt.js';
import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
  const requestData = await request.json();

  if (requestData.artist && requestData.album) {
    const ownerEmail = (await prisma.user.findFirst({ where: { role: 'OWNER' } }))?.email || '';
    const result = await searchForAlbumRelease(requestData.artist, requestData.album, ownerEmail);
    return json(result);
  }

  return new Response('Invalid request', { status: 400 });
};

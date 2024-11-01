import prisma from '$lib/server/prisma.js';
import { ROLE } from '$lib/shared/consts.js';
import { searchForAlbumRelease } from '$lib/shared/fetchAlbumArt.js';
import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
  const requestData = await request.json();

  if (requestData.query) {
    const ownerEmail = (await prisma.user.findFirst({ where: { role: ROLE.OWNER } }))?.email || '';
    const result = await searchForAlbumRelease(requestData.query, ownerEmail);
    return json(result);
  }

  return new Response('Invalid request', { status: 400 });
};

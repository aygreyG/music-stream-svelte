import { getRegenerationInProgress, regenerateAlbumImageNames } from '$lib/server/images';
import prisma from '$lib/server/prisma';
import { error, json } from '@sveltejs/kit';

export const GET = async () => {
  if (getRegenerationInProgress()) {
    return error(400, { message: 'Album art regeneration already in progress' });
  }

  const albums = await prisma.album.findMany();

  regenerateAlbumImageNames(albums);

  return json({ message: 'Album art generation started' });
};

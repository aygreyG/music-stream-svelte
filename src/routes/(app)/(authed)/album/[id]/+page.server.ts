import prisma from '$lib/server/prisma.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params, depends }) => {
  const { id } = params;

  depends('album:art');

  const album = await prisma.album.findUnique({
    where: { id: id },
    include: {
      tracks: { include: { artists: true }, orderBy: { trackNumber: 'asc' } },
      albumArtist: true
    }
  });

  if (!album) {
    error(404, 'Album not found');
  }

  return {
    user: locals.user,
    album,
    title: `${album.title} - ${album.albumArtist.name}`
  };
};

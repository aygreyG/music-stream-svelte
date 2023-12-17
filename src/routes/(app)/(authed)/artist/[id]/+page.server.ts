import prisma from '$lib/server/prisma.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const { id } = params;

  const artist = await prisma.artist.findUnique({
    where: { id: id },
    include: {
      albums: {
        orderBy: { releaseDate: 'asc' },
        include: { tracks: { orderBy: { trackNumber: 'asc' }, include: { artists: true } } }
      },
      tracks: {
        where: { album: { NOT: { albumArtistId: id } } },
        include: {
          artists: true,
          album: { include: { albumArtist: true, tracks: { include: { artists: true } } } }
        }
      }
    }
  });

  if (!artist) {
    throw error(404, 'Artist not found');
  }

  return {
    user: locals.user,
    artist,
    title: artist.name
  };
};

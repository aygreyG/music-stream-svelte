import prisma from '$lib/server/prisma.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const { id } = params;

  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      albums: {
        orderBy: { releaseDate: { sort: 'asc', nulls: 'last' } },
        include: {
          tracks: {
            orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
            include: { artists: true }
          }
        }
      },
      tracks: {
        where: { album: { NOT: { albumArtistId: id } } },
        include: {
          artists: true,
          album: {
            include: {
              albumArtist: true,
              tracks: {
                include: { artists: true },
                orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }]
              }
            }
          }
        }
      }
    }
  });

  if (!artist) {
    error(404, 'Artist not found');
  }

  return {
    user: locals.user,
    artist,
    title: artist.name
  };
};

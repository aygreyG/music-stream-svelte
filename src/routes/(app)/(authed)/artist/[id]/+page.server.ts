import prisma from '$lib/server/prisma.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params, setHeaders }) => {
  const { id } = params;

  const artist = await prisma.artist.findUnique({
    where: { id },
    select: {
      name: true,
      albums: {
        select: {
          id: true,
          title: true,
          albumArtId: true,
          albumArtDarkMuted: true,
          albumArtVibrant: true,
          albumArtMuted: true,
          albumArtLightVibrant: true,
          albumArtLightMuted: true,
          albumArtDarkVibrant: true
        },
        orderBy: { releaseDate: { sort: 'asc', nulls: 'last' } }
      },
      tracks: {
        where: { album: { NOT: { albumArtistId: id } } },

        select: {
          id: true,
          title: true,
          length: true,
          trackNumber: true,
          artists: { select: { name: true, id: true } },
          album: {
            select: {
              id: true,
              title: true,
              albumArtist: { select: { name: true, id: true } },
              albumArtId: true,
              albumArt: true,
              albumArtDarkMuted: true,
              albumArtVibrant: true,
              albumArtMuted: true,
              albumArtLightVibrant: true,
              albumArtLightMuted: true,
              albumArtDarkVibrant: true,
              tracks: {
                select: { id: true, title: true, artists: { select: { name: true, id: true } } }
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

  if (locals.serverSettings?.cacheKey !== undefined) {
    setHeaders({
      'cache-key': locals.serverSettings.cacheKey.toString()
    });
  }

  return {
    user: locals.user,
    artist,
    title: artist.name
  };
};

import prisma from '$lib/server/prisma.js';

import type { Prisma } from '../../../../generated/prisma-client/client';

export const load = async ({ locals, depends }) => {
  if (!locals.user) {
    return { favouriteTracks: [], albumSet: [], title: 'Favourites' };
  }

  depends('load:main');

  const user = await prisma.user.findUnique({
    where: { id: locals.user.id },
    select: {
      favouriteTracks: {
        select: {
          id: true,
          title: true,
          trackNumber: true,
          length: true,
          artists: {
            select: {
              id: true,
              name: true
            }
          },
          album: {
            select: {
              id: true,
              title: true,
              albumArtId: true,
              albumArt: true,
              albumArtist: {
                select: {
                  id: true,
                  name: true
                }
              },
              tracks: {
                select: {
                  id: true,
                  title: true,
                  artists: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const favouriteTracks = user?.favouriteTracks ?? [];

  const albumSet: Prisma.AlbumGetPayload<{
    select: {
      id: true;
      title: true;
      albumArtId: true;
    };
  }>[] = [];

  for (const track of favouriteTracks) {
    if (!albumSet.find((a) => a.id === track.album.id)) {
      albumSet.push(track.album);
    }

    if (albumSet.length === 4) break;
  }

  return {
    favouriteTracks,
    albumSet,
    title: 'Favourites'
  };
};

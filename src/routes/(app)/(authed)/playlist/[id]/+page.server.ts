import prisma from '$lib/server/prisma.js';
import { updateCacheKey } from '$lib/server/serverSettings';
import type { Prisma } from '../../../../../generated/prisma-client/client';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params, setHeaders }) => {
  const { id } = params;

  const playlist = await prisma.playlist.findFirst({
    where: {
      userId: locals.user?.id,
      id
    },
    select: {
      id: true,
      name: true,
      tracks: {
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
              albumArtVibrant: true,
              albumArtMuted: true,
              albumArtDarkVibrant: true,
              albumArtDarkMuted: true,
              albumArtLightVibrant: true,
              albumArtLightMuted: true,
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

  if (!playlist) {
    return error(404, 'Playlist not found');
  }

  const albumSet: Prisma.AlbumGetPayload<{
    select: {
      id: true;
      title: true;
      albumArtId: true;
      albumArtDarkMuted: true;
      albumArtVibrant: true;
      albumArtMuted: true;
      albumArtLightVibrant: true;
      albumArtLightMuted: true;
      albumArtDarkVibrant: true;
    };
  }>[] = [];

  for (const track of playlist.tracks) {
    if (!albumSet.find((a) => a.id === track.album.id)) {
      albumSet.push(track.album);
    }

    if (albumSet.length === 4) break;
  }

  if (locals.serverSettings?.cacheKey !== undefined) {
    setHeaders({
      'cache-key': locals.serverSettings.cacheKey.toString()
    });
  }

  return {
    user: locals.user,
    playlist,
    albumSet,
    title: `Playlist${playlist ? ` - ${playlist.name}` : ''}`
  };
};

export const actions = {
  remove: async ({ locals, request, params }) => {
    const formData = await request.formData();
    const trackId = formData.get('trackId')?.toString();
    const playlistId = params.id;

    if (!trackId || !playlistId || !locals.user) {
      return error(400, 'Invalid request');
    }

    const playlist = await prisma.playlist.update({
      where: {
        id: playlistId,
        userId: locals.user.id
      },
      data: {
        tracks: {
          disconnect: {
            id: trackId
          }
        }
      },
      select: {
        id: true
      }
    });

    await updateCacheKey();

    return {
      playlistId: playlist.id
    };
  }
};

import prisma from '$lib/server/prisma.js';
import type { Album } from '@prisma/client';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const { id } = params;

  const playlist = await prisma.playlist.findFirst({
    where: {
      userId: locals.user?.id,
      id
    },
    include: {
      tracks: {
        include: {
          album: {
            include: {
              albumArtist: true,
              tracks: {
                include: {
                  artists: true
                }
              }
            }
          },
          artists: true
        }
      }
    }
  });

  if (!playlist) {
    return error(404, 'Playlist not found');
  }

  const albumSet: Album[] = [];

  for (const track of playlist.tracks) {
    if (!albumSet.find((a) => a.id === track.album.id)) {
      albumSet.push(track.album);
    }

    if (albumSet.length === 4) break;
  }

  return {
    user: locals.user,
    playlist,
    albumSet,
    title: `Playlist${playlist ? ` - ${playlist.name}` : ''}`
  };
};

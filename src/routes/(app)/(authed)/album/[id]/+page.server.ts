import prisma from '$lib/server/prisma.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params, depends }) => {
  const { id } = params;

  depends('album:art');

  const album = await prisma.album.findUnique({
    where: { id: id },
    include: {
      tracks: {
        include: {
          artists: true,
          playlists: { where: { userId: locals.user?.id }, orderBy: { createdAt: 'desc' } }
        },
        orderBy: { trackNumber: 'asc' }
      },
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

export const actions = {
  addplaylist: async ({ request, locals }) => {
    const formData = await request.formData();
    const playlistname = formData.get('playlistname')?.toString();
    const trackId = formData.get('trackid')?.toString();

    if (!playlistname || !trackId || !locals.user) {
      return;
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: playlistname,
        tracks: {
          connect: {
            id: trackId
          }
        },
        user: {
          connect: {
            id: locals.user?.id
          }
        }
      }
    });

    return {
      playlist
    };
  },
  addtoplaylist: async ({ request, locals }) => {
    const formData = await request.formData();
    const playlistId = formData.get('playlistid')?.toString();
    const trackId = formData.get('trackid')?.toString();
    const shouldRemove = formData.get('remove')?.toString() === 'true';

    if (!playlistId || !trackId || !locals.user) {
      return;
    }

    if (shouldRemove) {
      const playlist = await prisma.playlist.update({
        where: {
          id: playlistId
        },
        data: {
          tracks: {
            disconnect: {
              id: trackId
            }
          }
        }
      });

      return {
        playlist
      };
    }

    const playlist = await prisma.playlist.update({
      where: {
        id: playlistId
      },
      data: {
        tracks: {
          connect: {
            id: trackId
          }
        }
      }
    });

    return {
      playlist
    };
  }
};

import { getPalette } from '$lib/server/images.js';
import prisma from '$lib/server/prisma.js';
import { error } from '@sveltejs/kit';
import { access, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

export const load = async ({ locals, params, depends }) => {
  const { id } = params;

  depends('album:art');

  const album = await prisma.album.findUnique({
    where: { id: id },
    select: {
      id: true,
      title: true,
      albumArtist: { select: { id: true, name: true } },
      albumArtistId: true,
      releaseDate: true,
      updatedAt: true,
      albumArtId: true,
      albumArtVibrant: true,
      albumArtMuted: true,
      albumArtDarkVibrant: true,
      albumArtDarkMuted: true,
      albumArtLightVibrant: true,
      albumArtLightMuted: true,
      albumArt: true,
      tracks: {
        select: {
          id: true,
          trackNumber: true,
          playlists: {
            where: { userId: locals.user?.id },
            orderBy: { createdAt: 'desc' }
          },
          artists: { select: { id: true, name: true } },
          length: true,
          title: true
        },
        orderBy: [
          {
            discNumber: 'asc'
          },
          { trackNumber: 'asc' }
        ]
      }
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
  },
  uploadart: async ({ request, params }) => {
    const { id } = params;
    const formData = await request.formData();
    const file = formData.get('artfile') as File;

    if (!file) {
      return;
    }

    const album = await prisma.album.findUnique({
      where: {
        id
      },
      include: {
        tracks: true,
        albumArtist: true
      }
    });

    if (album && album.tracks.length > 0) {
      const dir = album.tracks[0].filePath.substring(0, album.tracks[0].filePath.lastIndexOf('/'));
      const coversDir = join(dir, 'Covers');
      const regex = / |\.|\[|\]|\\|\//g;
      const albumArtFileName = `${album.albumArtist.name.replaceAll(
        regex,
        '_'
      )}_${album.title?.replaceAll(regex, '_')}`;

      try {
        if (
          await access(coversDir)
            .then(() => false)
            .catch(() => true)
        ) {
          await mkdir(coversDir);
        } else {
          await rm(coversDir, { recursive: true });
          await mkdir(coversDir);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const palette = await getPalette(buffer);
        await writeFile(
          join(coversDir, `${albumArtFileName}.${file.name.split('.').pop()}`),
          buffer
        );
        const albumArtId = crypto.randomUUID();
        await prisma.album.update({
          where: {
            id
          },
          data: {
            albumArt: join(coversDir, `${albumArtFileName}.${file.name.split('.').pop()}`),
            albumArtId,
            albumArtVibrant: palette.vibrant,
            albumArtMuted: palette.muted,
            albumArtDarkVibrant: palette.darkVibrant,
            albumArtDarkMuted: palette.darkMuted,
            albumArtLightVibrant: palette.lightVibrant,
            albumArtLightMuted: palette.lightMuted,
            albumArtAccent: palette.vibrant
          }
        });

        return { message: 'Album art fetched', albumArtId };
      } catch (e) {
        console.error(e);
        return { message: 'Failed to fetch album art' };
      }
    } else {
      return { message: 'Album not found' };
    }
  }
};

import { access, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

import { error } from '@sveltejs/kit';

import { getAlbumArtFileName } from '$lib/server/images.js';
import prisma from '$lib/server/prisma.js';
import { updateCacheKey } from '$lib/server/serverSettings.js';

export const load = async ({ locals, params, depends, setHeaders }) => {
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
      albumArt: true,
      tracks: {
        select: {
          id: true,
          trackNumber: true,
          discNumber: true,
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

  if (locals.serverSettings?.cacheKey !== undefined) {
    setHeaders({
      'cache-key': locals.serverSettings.cacheKey.toString()
    });
  }

  const tags = await prisma.tag.findMany({
    where: {
      tracks: {
        some: {
          albumId: id
        }
      }
    }
  });

  return {
    album,
    title: `${album.title} - ${album.albumArtist.name}`,
    tags
  };
};

export const actions = {
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
      const albumArtFileName = getAlbumArtFileName(album.albumArtist.name, album.title);

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
            albumArtId
          }
        });

        await updateCacheKey();

        return {
          message: 'Album art fetched',
          albumArtInfo: {
            albumArtId
          }
        };
      } catch (e) {
        console.error(e);
        return { message: 'Failed to fetch album art' };
      }
    } else {
      return { message: 'Album not found' };
    }
  }
};

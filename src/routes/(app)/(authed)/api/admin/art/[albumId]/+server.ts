import prisma from '$lib/server/prisma.js';
import { getAlbumArtUrl } from '$lib/shared/fetchAlbumArt.js';
import { error, json } from '@sveltejs/kit';
import { access, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { getAlbumArtFileName, getPalette } from '$lib/server/images';

export const POST = async ({ request, params }) => {
  const { albumId } = params;
  const requestData = await request.json();

  if (requestData.releaseId) {
    const { releaseId } = requestData;

    const album = await prisma.album.findUnique({
      where: {
        id: albumId
      },
      include: {
        tracks: true,
        albumArtist: true
      }
    });

    if (album && album.tracks.length > 0) {
      const url = getAlbumArtUrl(releaseId);
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

        const albumArt = await fetch(url);
        const ext = albumArt.headers.get('content-type')?.split('/')[1] || 'jpg';
        const buffer = Buffer.from(await albumArt.arrayBuffer());
        await writeFile(join(coversDir, `${albumArtFileName}.${ext}`), buffer);

        const albumArtPalette = await getPalette(buffer);
        const albumArtId = crypto.randomUUID();

        await prisma.album.update({
          where: {
            id: albumId
          },
          data: {
            albumArt: join(coversDir, `${albumArtFileName}.${ext}`),
            albumArtId,
            albumArtAccent: albumArtPalette.vibrant,
            albumArtVibrant: albumArtPalette.vibrant,
            albumArtMuted: albumArtPalette.muted,
            albumArtLightVibrant: albumArtPalette.lightVibrant,
            albumArtDarkVibrant: albumArtPalette.darkVibrant,
            albumArtLightMuted: albumArtPalette.lightMuted,
            albumArtDarkMuted: albumArtPalette.darkMuted
          }
        });

        return json({
          message: 'Album art fetched',
          albumArtInfo: {
            albumArtId,
            albumArtVibrant: albumArtPalette.vibrant,
            albumArtMuted: albumArtPalette.muted,
            albumArtDarkVibrant: albumArtPalette.darkVibrant,
            albumArtDarkMuted: albumArtPalette.darkMuted,
            albumArtLightVibrant: albumArtPalette.lightVibrant,
            albumArtLightMuted: albumArtPalette.lightMuted,
            albumArtAccent: albumArtPalette.vibrant
          }
        });
      } catch (e) {
        console.error(e);
        error(500, { message: 'Failed to fetch album art' });
      }
    } else {
      error(400, { message: 'Album not found' });
    }
  } else {
    error(400, { message: 'No releaseId provided' });
  }
};

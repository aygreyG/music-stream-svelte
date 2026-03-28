import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

import { parseFile } from 'music-metadata';

import { ALLOWED_MUSIC_FILE_EXTENSIONS } from '$lib/shared/consts';
import type { TaskDefinition } from '$lib/shared/types';

import type { Album } from '../../../../generated/prisma-client/client';
import { getAlbumArt } from '../../images';
import prisma from '../../prisma';
import { errorToNull, isFileNameValid, serverLog } from '../../utils';
import { completeTask, failTask, isAnyTaskRunning, startTask, updateTask } from '../taskManager';

const definition: TaskDefinition = {
  taskId: 'album-art-regeneration',
  label: 'Regenerate Album Art',
  description:
    'This will regenerate all album images, if already present it will most likely pick the existing image up.',
  execute: async () => {
    const albums = await prisma.album.findMany();
    return regenerateAlbumImageNames(albums);
  }
};

async function regenerateAlbumImageNames(album: Album[]) {
  if (isAnyTaskRunning()) {
    return;
  }

  startTask(definition, `Processing 0/${album.length} albums.`);
  serverLog('Starting album art regeneration', 'info');

  try {
    for (let i = 0; i < album.length; i++) {
      const alb = album[i];
      let dir = '';

      if (alb.albumArt) {
        const imageBuffer = await errorToNull(readFile(alb.albumArt));
        if (imageBuffer) continue;

        dir = alb.albumArt.substring(0, alb.albumArt.lastIndexOf('/'));
        if (dir.endsWith('/Covers')) {
          dir = dir.substring(0, dir.lastIndexOf('/Covers'));
        }
      } else {
        const tracks = await prisma.track.findMany({
          where: { albumId: alb.id },
          take: 1
        });

        if (tracks.length === 0) {
          continue;
        }

        const track = tracks[0];
        dir = track.filePath.substring(0, track.filePath.lastIndexOf('/'));
      }

      const files = await readdir(dir);

      const musicFile = files.find((f) => {
        if (!isFileNameValid(f)) return false;
        const ext = f.split('.').pop()?.toLowerCase();
        if (!ext) return false;
        return ALLOWED_MUSIC_FILE_EXTENSIONS.includes(ext);
      });

      if (!musicFile) continue;

      const fileData = await errorToNull(parseFile(join(dir, musicFile)));
      if (!fileData) continue;

      const artist = await prisma.artist.findUnique({
        where: { id: alb.albumArtistId }
      });

      if (!artist) continue;

      const albumArtData = await getAlbumArt(dir, fileData, artist);
      if (!albumArtData) continue;

      await prisma.album.update({
        where: { id: alb.id },
        data: {
          albumArt: albumArtData,
          albumArtId: crypto.randomUUID()
        }
      });

      serverLog(`Regenerated album art path for album: ${alb.title}`, 'info');

      const progress = Math.round(((i + 1) / album.length) * 100);
      updateTask(definition, {
        progress,
        message: `Processing ${i + 1}/${album.length} albums.`
      });
    }
    serverLog('Finished album art regeneration', 'info');
    completeTask(definition, `Completed - ${album.length} albums processed.`);
  } catch (err) {
    serverLog(`Album art regeneration failed: ${err}`, 'error');
    failTask(definition, `Album art regeneration failed: ${err}`);
  }
}

export default definition;

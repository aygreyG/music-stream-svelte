import type { AlbumWithArt, ImageSize } from '$lib/shared/types';
import { readFile, access, writeFile, readdir, mkdir } from 'fs/promises';
import sharp from 'sharp';
import { Vibrant } from 'node-vibrant/node';
import { parseFile, type IAudioMetadata } from 'music-metadata';
import type { Album, Artist } from '../../generated/prisma-client/client';
import { join } from 'path';
import { errorToNull, isFileNameValid, serverLog } from './utils';
import { ALLOWED_MUSIC_FILE_EXTENSIONS } from '$lib/shared/consts';
import prisma from './prisma';

export const IMAGE_REGEX = / |\.|\[|\]|\\|\/|_|:|"/g;

export type Palette = {
  vibrant: string;
  muted: string;
  darkVibrant: string;
  darkMuted: string;
  lightVibrant: string;
  lightMuted: string;
};

type ExtendedImageSize = ImageSize | '';
type ImageExtension = 'avif' | 'webp' | '';

let regenerationInProgress = false;

export function getRegenerationInProgress() {
  return regenerationInProgress;
}

export async function getImage(
  album: AlbumWithArt,
  size: ExtendedImageSize = '',
  imageExt: ImageExtension = '',
  blur: boolean = false
) {
  let extension: string = imageExt;

  if (imageExt === '') {
    extension = album.albumArt.split('.').pop() as string;
  }

  const imagePath = `${album.albumArt.substring(0, album.albumArt.lastIndexOf('.'))}_${size}${
    blur ? '_blur' : ''
  }.${extension}`;

  if (
    await access(imagePath)
      .then(() => true)
      .catch(() => false)
  ) {
    return {
      extension,
      imageBuffer: await readFile(imagePath)
    };
  } else {
    const imageBuffer = await createImage(album.albumArt, imagePath, extension, size, blur);

    return { extension, imageBuffer };
  }
}

async function createImage(
  from: string,
  to: string,
  extension: string,
  size: ExtendedImageSize,
  blur: boolean
) {
  const file = await readFile(from);

  const image = sharp(file);

  if (extension === 'avif') {
    image.avif();
  } else if (extension === 'webp') {
    image.webp();
  }

  switch (size) {
    case 's':
      image.resize({ width: 150, height: 150 });
      break;
    case 'm':
      image.resize({ width: 200, height: 200 });
      break;
    case 'l':
      image.resize({ width: 300, height: 300 });
      break;
  }

  if (blur) image.blur(3);

  const imageBuffer = await image.toBuffer();

  await writeFile(to, imageBuffer);

  return imageBuffer;
}

export async function getAccentColor(image: Buffer | string) {
  const palette = await Vibrant.from(image).getPalette();

  return palette.Vibrant?.hex || '#ffffff';
}

export async function getPalette(image: Buffer | string): Promise<Palette> {
  const palette = await Vibrant.from(image).quality(1).getPalette();

  return {
    vibrant: palette.Vibrant?.hex || '#ffffff',
    muted: palette.Muted?.hex || '#ffffff',
    darkVibrant: palette.DarkVibrant?.hex || '#ffffff',
    darkMuted: palette.DarkMuted?.hex || '#ffffff',
    lightVibrant: palette.LightVibrant?.hex || '#ffffff',
    lightMuted: palette.LightMuted?.hex || '#ffffff'
  };
}

export function getAlbumArtFileName(albumArtist: string, albumTitle: string) {
  return `${albumArtist.replaceAll(IMAGE_REGEX, '_')}_${albumTitle
    .replaceAll(IMAGE_REGEX, '_')
    .replaceAll('?', '')}`;
}

/**
 * Searches for an album file in a directory based on the given file names and album art file name.
 */
export async function searchForAlbumFile(
  fileNames: string[],
  dir: string,
  albumArtFileName?: string
) {
  const albumArtNames = [
    'front',
    'art',
    'albumart',
    'cover',
    'folder',
    albumArtFileName?.toLowerCase()
  ];
  for (const fileName of fileNames) {
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    if (
      fileExt === 'jpg' ||
      fileExt === 'jpeg' ||
      fileExt === 'png' ||
      fileExt === 'webp' ||
      fileExt === 'avif'
    ) {
      const fileBaseName = fileName.split('.').slice(0, -1).join('.').toLowerCase();
      if (albumArtNames.includes(fileBaseName)) {
        return join(dir, fileName);
      }
    }
  }
}

export async function getAlbumArt(
  dir: string,
  fileData: IAudioMetadata,
  albumArtist: Artist
): Promise<{ albumLocation: string; palette: Palette } | null> {
  const albumArtFileName = `${albumArtist.name.replaceAll(
    IMAGE_REGEX,
    '_'
  )}_${fileData.common.album?.replaceAll(IMAGE_REGEX, '_')?.replaceAll('?', '')}`;

  const coversDir = join(dir, 'Covers');

  if (
    await access(coversDir)
      .then(() => true)
      .catch(() => false)
  ) {
    const coverFiles = await readdir(coversDir);
    const coverFile = await searchForAlbumFile(coverFiles, coversDir, albumArtFileName);

    if (coverFile) {
      return {
        albumLocation: coverFile,
        palette: await getPalette(coverFile)
      };
    }
  }

  // get album art from metadata
  const albumArt = fileData.common.picture?.[0].data;
  const albumArtType = fileData.common.picture?.[0].format.split('/')[1];
  const albumArtPath = join(dir, 'Covers', `${albumArtFileName}.${albumArtType}`);

  if (albumArt) {
    try {
      const coversDir = join(dir, 'Covers');
      await access(coversDir).catch(() => mkdir(coversDir));
      await writeFile(albumArtPath, albumArt);
      return {
        albumLocation: albumArtPath,
        palette: await getPalette(albumArtPath)
      };
    } catch (err) {
      serverLog(`Could not create album art file ${err}`, 'warn');
    }
  }

  // get album art from directory
  const files = await readdir(dir);
  const fileName = await searchForAlbumFile(files, dir);

  if (fileName) {
    try {
      const coversDir = join(dir, 'Covers');
      await access(coversDir).catch(() => mkdir(coversDir));
      const buffer = await readFile(fileName);
      const extension = fileName.split('.').pop();
      const pathToWrite = join(coversDir, albumArtFileName) + '.' + extension;
      await writeFile(pathToWrite, buffer);
      return {
        albumLocation: pathToWrite,
        palette: await getPalette(pathToWrite)
      };
    } catch (err) {
      serverLog(`Could not create album art file ${err}`, 'warn');
    }
  }

  return null;
}

export async function regenerateAlbumImageNames(album: Album[]) {
  if (regenerationInProgress) {
    return;
  }

  regenerationInProgress = true;
  serverLog('Starting album art regeneration', 'info');

  for (const alb of album) {
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
        albumArt: albumArtData.albumLocation,
        albumArtId: crypto.randomUUID(),
        albumArtVibrant: albumArtData.palette.vibrant,
        albumArtMuted: albumArtData.palette.muted,
        albumArtDarkVibrant: albumArtData.palette.darkVibrant,
        albumArtDarkMuted: albumArtData.palette.darkMuted,
        albumArtLightVibrant: albumArtData.palette.lightVibrant,
        albumArtLightMuted: albumArtData.palette.lightMuted
      }
    });

    serverLog(`Regenerated album art path for album: ${alb.title}`, 'info');
  }
  serverLog('Finished album art regeneration', 'info');
  regenerationInProgress = false;
}

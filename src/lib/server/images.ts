import { access, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { type IAudioMetadata } from 'music-metadata';
import sharp from 'sharp';

import { IMAGE_FILE_EXTENSIONS } from '$lib/shared/consts';
import type { AlbumWithArt, ImageSize } from '$lib/shared/types';

import type { Artist } from '../../generated/prisma-client/client';
import { serverLog } from './utils';

export const IMAGE_REGEX = / |\.|\[|\]|\\|\/|_|:|"/g;

type ExtendedImageSize = ImageSize | '';
type ImageExtension = 'avif' | 'webp' | '';

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
    if (IMAGE_FILE_EXTENSIONS.includes(fileExt || '')) {
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
): Promise<string | null> {
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
      return coverFile;
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
      return albumArtPath;
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
      return pathToWrite;
    } catch (err) {
      serverLog(`Could not create album art file ${err}`, 'warn');
    }
  }

  return null;
}

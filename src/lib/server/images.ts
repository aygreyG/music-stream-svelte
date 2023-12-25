import type { AlbumWithArt, ImageSize } from '$lib/shared/types';
import { readFile, access, writeFile } from 'fs/promises';
import sharp from 'sharp';

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

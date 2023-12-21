import { getImage } from '$lib/server/images.js';
import prisma from '$lib/server/prisma.js';
import { isValidImageSize, type AlbumWithArt } from '$lib/shared/types.js';
import { error, redirect } from '@sveltejs/kit';

export const GET = async ({ params, setHeaders }) => {
  const { albumId, size } = params;

  const album = await prisma.album.findUnique({
    where: {
      id: albumId
    }
  });

  if (!album || !isValidImageSize(size)) {
    throw error(404, { message: 'Album not found' });
  }

  if (album.albumArt) {
    try {
      const { extension, imageBuffer } = await getImage(album as AlbumWithArt, size);

      setHeaders({
        'Content-Type': `image/${extension}`,
        'Cache-Control': 'public, max-age=15552000'
      });

      return new Response(imageBuffer);
    } catch (err) {
      console.log(err);
      throw error(500, { message: 'Internal server error' });
    }
  } else {
    setHeaders({
      'Cache-Control': 'no-cache'
    });

    throw redirect(307, '/album.png');
  }
};
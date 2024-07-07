import { getImage } from '$lib/server/images.js';
import prisma from '$lib/server/prisma.js';
import { isValidImageSize, type AlbumWithArt } from '$lib/shared/types.js';
import { error, redirect } from '@sveltejs/kit';

export const GET = async ({ params, setHeaders, url }) => {
  const { albumId, albumArtId, size } = params;
  const blur = !!url.searchParams.get('blur');

  const album = await prisma.album.findUnique({
    select: {
      albumArt: true
    },
    where: {
      id: albumId,
      albumArtId
    }
  });

  if (!album || !isValidImageSize(size)) {
    error(404, { message: 'Album not found' });
  }

  if (album.albumArt) {
    try {
      const { extension, imageBuffer } = await getImage(album as AlbumWithArt, size, 'webp', blur);

      setHeaders({
        'Content-Type': `image/${extension}`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });

      return new Response(imageBuffer);
    } catch (err) {
      console.log(err);
      error(500, { message: 'Internal server error' });
    }
  } else {
    setHeaders({
      'Cache-Control': 'no-cache'
    });

    redirect(307, blur ? '/album_sm_blur.png' : '/album.png');
  }
};

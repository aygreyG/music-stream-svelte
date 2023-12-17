import prisma from '$lib/server/prisma.js';
import { error, redirect } from '@sveltejs/kit';
import { readFile } from 'fs/promises';

export const GET = async ({ params, setHeaders }) => {
  const { albumId } = params;

  const album = await prisma.album.findUnique({
    where: {
      id: albumId
    }
  });

  if (!album) {
    throw error(404, { message: 'Album not found' });
  }

  if (album.albumArt) {
    try {
      const image = await readFile(album.albumArt);
      const imageType = album.albumArt.split('.').pop();

      setHeaders({
        'Content-Type': `image/${imageType}`,
        'Cache-Control': 'public, max-age=15552000'
      });

      return new Response(image);
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

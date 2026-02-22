import prisma from '$lib/server/prisma';

export const load = async ({ locals, setHeaders }) => {
  const albums = await prisma.album.findMany({
    select: {
      albumArtId: true,
      id: true,
      title: true,
      albumArtist: { select: { name: true } }
    },
    orderBy: [{ albumArtist: { name: 'asc' } }, { releaseDate: 'asc' }, { title: 'asc' }]
  });

  if (locals.serverSettings?.cacheKey !== undefined) {
    setHeaders({
      'cache-key': locals.serverSettings.cacheKey.toString()
    });
  }

  return {
    // Prisma does not support case insensitive sorting https://github.com/prisma/prisma/issues/5068
    albums: albums.sort((a, b) => {
      const artistA = a.albumArtist?.name || '';
      const artistB = b.albumArtist?.name || '';
      if (artistA === artistB) {
        return a.title.localeCompare(b.title);
      }
      return artistA.localeCompare(artistB);
    }),
    title: 'Albums'
  };
};

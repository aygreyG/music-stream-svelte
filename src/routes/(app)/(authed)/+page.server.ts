import prisma from '$lib/server/prisma';

export const load = async ({ locals, setHeaders }) => {
  const albums = await prisma.album.findMany({
    select: {
      albumArtDarkMuted: true,
      albumArtVibrant: true,
      albumArtMuted: true,
      albumArtLightVibrant: true,
      albumArtLightMuted: true,
      albumArtDarkVibrant: true,
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
    albums,
    title: 'Albums'
  };
};

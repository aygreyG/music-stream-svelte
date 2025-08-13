import prisma from '$lib/server/prisma.js';

export const load = async ({ locals, setHeaders }) => {
  const artists = await prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      sanitized: true,
      _count: { select: { albums: true, tracks: true } }
    },
    orderBy: { name: 'asc' }
  });

  if (locals.serverSettings?.cacheKey !== undefined) {
    setHeaders({
      'cache-key': locals.serverSettings.cacheKey.toString()
    });
  }

  return {
    user: locals.user,
    artists,
    title: 'Artists'
  };
};

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
    // Prisma does not support case insensitive sorting https://github.com/prisma/prisma/issues/5068
    artists: artists.sort((a, b) => a.name.localeCompare(b.name)),
    title: 'Artists'
  };
};

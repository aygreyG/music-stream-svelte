import prisma from '$lib/server/prisma';

export const load = async ({ locals, setHeaders }) => {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      tracks: {
        select: { albumId: true },
        distinct: ['albumId']
      }
    },
    orderBy: { name: 'asc' }
  });

  if (locals.serverSettings?.cacheKey !== undefined) {
    setHeaders({
      'cache-key': locals.serverSettings.cacheKey.toString()
    });
  }

  const tagsWithCount = tags
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      albumCount: tag.tracks.length
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    tags: tagsWithCount,
    title: 'Tags'
  };
};

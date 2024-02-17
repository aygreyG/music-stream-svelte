import prisma from '$lib/server/prisma.js';

export const load = async ({ locals }) => {
  const artists = await prisma.artist.findMany({
    include: { _count: { select: { albums: true, tracks: true } } },
    orderBy: { name: 'asc' }
  });

  return {
    user: locals.user,
    artists,
    title: 'Artists'
  };
};

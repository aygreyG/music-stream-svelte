import prisma from '$lib/server/prisma.js';

export const load = async ({ locals }) => {
  const artists = await prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      sanitized: true,
      _count: { select: { albums: true, tracks: true } }
    },
    orderBy: { name: 'asc' }
  });

  return {
    user: locals.user,
    artists,
    title: 'Artists'
  };
};

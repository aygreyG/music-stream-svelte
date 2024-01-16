import prisma from '$lib/server/prisma';

export const load = async () => {
  const albums = await prisma.album.findMany({
    include: { albumArtist: true },
    orderBy: [{ albumArtist: { name: 'asc' } }, { title: 'asc' }]
  });

  return {
    albums,
    title: 'Albums'
  };
};

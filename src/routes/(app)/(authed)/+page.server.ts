import prisma from '$lib/server/prisma';

export const load = async () => {
  const albums = await prisma.album.findMany({
    select: {
      albumArtAccent: true,
      albumArtId: true,
      id: true,
      title: true,
      albumArtist: { select: { name: true } }
    },
    orderBy: [{ albumArtist: { name: 'asc' } }, { releaseDate: 'asc' }, { title: 'asc' }]
  });

  return {
    albums,
    title: 'Albums'
  };
};

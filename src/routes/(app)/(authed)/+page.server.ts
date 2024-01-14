import prisma from '$lib/server/prisma';

export const load = async () => {
  return {
    albums: await prisma.album.findMany({ include: { albumArtist: true } }),
    title: 'Albums'
  };
};

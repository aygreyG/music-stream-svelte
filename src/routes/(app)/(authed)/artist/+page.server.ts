import prisma from '$lib/server/prisma.js';

export const load = async ({ locals }) => {
  const artists = await prisma.artist.findMany();

  return {
    user: locals.user,
    artists
  };
};

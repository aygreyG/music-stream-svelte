import prisma from '$lib/server/prisma.js';

export const load = async ({ locals, params }) => {
  const { id } = params;

  const playlist = await prisma.playlist.findFirst({
    where: {
      userId: locals.user?.id,
      id
    },
    include: {
      tracks: {
        include: {
          album: true
        }
      }
    }
  });

  return {
    user: locals.user,
    playlist,
    title: `Playlist${playlist ? ` - ${playlist.name}` : ''}`
  };
};

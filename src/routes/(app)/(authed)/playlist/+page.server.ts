import prisma from '$lib/server/prisma.js';

export const load = async ({ locals }) => {
  const playlists = await prisma.playlist.findMany({
    where: {
      userId: locals.user?.id
    },
    include: {
      tracks: {
        include: {
          album: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return {
    user: locals.user,
    playlists,
    title: 'Playlists'
  };
};

export const actions = {
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id || !locals.user) {
      return;
    }

    await prisma.playlist.delete({
      where: {
        id: id,
        userId: locals.user.id
      }
    });
  },
  add: async ({ request, locals }) => {
    if (!locals.user) {
      return;
    }

    const formData = await request.formData();
    const name =
      formData.get('name')?.toString() ||
      `${locals.user?.username}'s playlist #${locals.user.playlists.length + 1}`;

    if (!name) {
      return;
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        user: {
          connect: {
            id: locals.user.id
          }
        }
      }
    });

    return {
      playlist
    };
  },
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const name = formData.get('name')?.toString();

    if (!id || !name || !locals.user) {
      return;
    }

    await prisma.playlist.update({
      where: {
        id: id,
        userId: locals.user.id
      },
      data: {
        name
      }
    });
  }
};

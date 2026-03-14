import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
  const id = params.id;

  const tag = await prisma.tag.findUnique({
    where: {
      id
    }
  });

  if (!tag) {
    error(404, 'Tag not found');
  }

  const albums = await prisma.album.findMany({
    where: {
      tracks: {
        some: {
          tags: {
            some: {
              id
            }
          }
        }
      }
    },
    select: {
      id: true,
      title: true,
      albumArtist: { select: { name: true } },
      albumArtId: true
    },
    orderBy: [{ albumArtist: { name: 'asc' } }, { releaseDate: 'asc' }, { title: 'asc' }]
  });

  return {
    tag,
    albums,
    title: `Tag - ${tag.name}`
  };
};

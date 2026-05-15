import { json } from '@sveltejs/kit';

import prisma from '$lib/server/prisma.js';

export const POST = async ({ params, locals }) => {
  const { trackId } = params;

  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: locals.user.id },
    select: {
      favouriteTracks: {
        where: { id: trackId },
        select: { id: true }
      }
    }
  });

  const isFavourited = (user?.favouriteTracks.length ?? 0) > 0;

  await prisma.user.update({
    where: { id: locals.user.id },
    data: {
      favouriteTracks: isFavourited ? { disconnect: { id: trackId } } : { connect: { id: trackId } }
    }
  });

  return json({ favourited: !isFavourited });
};

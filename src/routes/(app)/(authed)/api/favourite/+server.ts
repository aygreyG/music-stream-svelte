import { json } from '@sveltejs/kit';

import prisma from '$lib/server/prisma.js';

export const GET = async ({ locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: locals.user.id },
    select: {
      favouriteTracks: {
        select: {
          id: true,
          title: true,
          length: true,
          trackNumber: true,
          artists: {
            select: {
              id: true,
              name: true
            }
          },
          album: {
            select: {
              id: true,
              title: true,
              albumArtId: true,
              albumArt: true,
              albumArtist: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  return json({ tracks: user?.favouriteTracks ?? [] });
};

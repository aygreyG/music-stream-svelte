import prisma from '$lib/server/prisma.js';
import { json } from '@sveltejs/kit';

export const POST = async ({ params, request, locals }) => {
  const { id } = params;
  const requestData = await request.json();

  if (requestData.duration && locals.user) {
    const duration = parseFloat(requestData.duration);
    const listen = await prisma.listened.findFirst({
      where: {
        trackId: id,
        userId: locals.user.id
      }
    });

    let updatedListen;

    if (listen) {
      updatedListen = await prisma.listened.update({
        where: {
          id: listen.id
        },
        data: {
          listeningTime: listen.listeningTime ? listen.listeningTime + duration : duration
        }
      });
    } else {
      updatedListen = await prisma.listened.create({
        data: {
          listeningTime: duration,
          track: {
            connect: {
              id
            }
          },
          user: {
            connect: {
              id: locals.user.id
            }
          }
        }
      });
    }

    return json({ duration: updatedListen.listeningTime });
  }

  return new Response('Invalid request', { status: 400 });
};

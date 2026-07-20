import { json } from '@sveltejs/kit';

import prisma from '$lib/server/prisma.js';
import { SESSION_TIMEOUT_MS } from '$lib/shared/consts.js';

export const POST = async ({ params, request, locals }) => {
  const { id: trackId } = params;

  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const requestData = await request.json();
  const duration = parseFloat(requestData.duration);
  const startedAt = requestData.startedAt ? new Date(requestData.startedAt) : null;

  if (!duration || !startedAt || isNaN(startedAt.getTime())) {
    return new Response('Invalid request', { status: 400 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - SESSION_TIMEOUT_MS);

  let session = await prisma.listeningSession.findFirst({
    where: {
      userId: locals.user.id,
      endedAt: { gt: cutoff }
    },
    orderBy: { endedAt: 'desc' }
  });

  if (!session) {
    session = await prisma.listeningSession.create({
      data: {
        userId: locals.user.id,
        startedAt
      }
    });
  }

  let event = await prisma.listeningEvent.findFirst({
    where: {
      sessionId: session.id,
      trackId,
      startedAt
    }
  });

  if (event) {
    event = await prisma.listeningEvent.update({
      where: { id: event.id },
      data: { listenedDuration: event.listenedDuration + duration }
    });
  } else {
    event = await prisma.listeningEvent.create({
      data: {
        sessionId: session.id,
        trackId,
        startedAt,
        listenedDuration: duration
      }
    });
  }

  await prisma.listeningSession.update({
    where: { id: session.id },
    data: { endedAt: now }
  });

  return json({ duration: event.listenedDuration });
};

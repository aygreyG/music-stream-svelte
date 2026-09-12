import prisma from '$lib/server/prisma.js';
import { SESSIONS_PER_PAGE } from '$lib/shared/consts.js';

const trackSelect = {
  id: true,
  title: true,
  length: true,
  trackNumber: true,
  artists: { select: { name: true, id: true } },
  album: {
    select: {
      id: true,
      title: true,
      albumArtist: { select: { name: true, id: true } },
      albumArtId: true,
      albumArt: true,
      tracks: {
        select: { id: true, title: true, artists: { select: { name: true, id: true } } }
      }
    }
  }
} as const;

const sessionSelect = {
  id: true,
  startedAt: true,
  endedAt: true,
  events: {
    select: {
      id: true,
      startedAt: true,
      listenedDuration: true,
      track: { select: trackSelect }
    },
    orderBy: { startedAt: 'desc' as const }
  }
};

export const load = async ({ locals, depends }) => {
  depends('load:listened');

  const [sessions, totalSessions, totalListeningTimeResult] = await Promise.all([
    prisma.listeningSession.findMany({
      where: { userId: locals.user?.id },
      select: sessionSelect,
      orderBy: [{ endedAt: 'desc' }, { id: 'desc' }],
      take: SESSIONS_PER_PAGE
    }),
    prisma.listeningSession.count({ where: { userId: locals.user?.id } }),
    prisma.listeningEvent.aggregate({
      where: { session: { userId: locals.user?.id } },
      _sum: { listenedDuration: true }
    })
  ]);

  return {
    title: 'History',
    sessions,
    totalSessions,
    totalListeningTime: totalListeningTimeResult._sum.listenedDuration
  };
};

export const actions = {
  getSessions: async ({ locals, request }) => {
    const formData = await request.formData();
    const cursorId = formData.get('cursorId')?.toString();

    const sessions = await prisma.listeningSession.findMany({
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      where: { userId: locals.user?.id },
      select: sessionSelect,
      orderBy: [{ endedAt: 'desc' }, { id: 'desc' }],
      take: SESSIONS_PER_PAGE
    });

    return { sessions };
  }
};

import { subscribeLogs, unsubscribeLogs } from '$lib/server/logEvents';
import prisma from '$lib/server/prisma';
import { getLog } from '$lib/server/utils';
import type { LogEvent } from '$lib/shared/types';

export const GET = async () => {
  const [logs, dbLogsRaw] = await Promise.all([
    getLog(),
    prisma.log.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  const dbLogs = dbLogsRaw.map((l) => ({
    id: l.id,
    level: l.level,
    message: l.message,
    createdAt: l.createdAt.toISOString()
  }));

  let send: ((event: LogEvent) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const snapshot: LogEvent = {
        type: 'snapshot',
        logs,
        dbLogs
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));

      send = (event: LogEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          if (send) unsubscribeLogs(send);
        }
      };

      subscribeLogs(send);
    },
    cancel() {
      if (send) unsubscribeLogs(send);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
};

import { getTaskStates, subscribeTasks, unsubscribeTasks } from '$lib/server/tasks/taskManager';
import type { TaskEvent } from '$lib/shared/types';

export const GET = async () => {
  let send: ((event: TaskEvent) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial snapshot with current task states
      const snapshot: TaskEvent = {
        type: 'snapshot',
        tasks: getTaskStates()
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));

      send = (event: TaskEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          if (send) unsubscribeTasks(send);
        }
      };

      subscribeTasks(send, false);
    },
    cancel() {
      if (send) unsubscribeTasks(send);
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

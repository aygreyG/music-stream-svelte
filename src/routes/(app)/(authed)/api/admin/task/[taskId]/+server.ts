import definitions from '$lib/server/tasks/definitions';
import { isAnyTaskRunning } from '$lib/server/tasks/taskManager';
import { error, json } from '@sveltejs/kit';

export const PUT = async ({ params }) => {
  const { taskId } = params;

  if (!taskId) {
    error(400, 'Task ID is required');
  }

  if (isAnyTaskRunning()) {
    error(
      400,
      'Another task is currently running. Please wait for it to complete before starting a new one.'
    );
  }

  const task = definitions.find((t) => t.taskId === taskId);

  if (!task) {
    error(404, 'Task not found');
  }

  task.execute();

  return json({ message: `${task.taskId} started` });
};

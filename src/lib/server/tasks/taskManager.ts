import { type TaskDefinition, type TaskEvent, type TaskState } from '$lib/shared/types';

type TaskSubscriber = (event: TaskEvent) => void;

const tasks: Map<string, TaskState> = new Map();
const taskSubscribers: Set<TaskSubscriber> = new Set();

function broadcastTask(event: TaskEvent) {
  for (const subscriber of taskSubscribers) {
    try {
      subscriber(event);
    } catch {
      taskSubscribers.delete(subscriber);
    }
  }
}

export function getTaskStates(): TaskState[] {
  return Array.from(tasks.values());
}

export function getTaskState(id: string): TaskState {
  return tasks.get(id)!;
}

export function isTaskRunning(id: string): boolean {
  return tasks.get(id)!.status === 'running';
}

export function isAnyTaskRunning(): boolean {
  return Array.from(tasks.values()).some((t) => t.status === 'running');
}

export function startTask(task: TaskDefinition, message?: string) {
  const state: TaskState = {
    id: task.taskId,
    name: task.label,
    status: 'running',
    progress: 0,
    message: message || `${task.label} started`,
    startedAt: new Date().toISOString(),
    completedAt: undefined,
    error: undefined
  };
  tasks.set(task.taskId, state);
  broadcastTask({ type: 'update', task: state });
}

export function updateTask(task: TaskDefinition, update: { progress?: number; message?: string }) {
  const current = tasks.get(task.taskId)!;
  const state: TaskState = {
    ...current,
    ...update
  };
  tasks.set(task.taskId, state);
  broadcastTask({ type: 'update', task: state });
}

export function completeTask(task: TaskDefinition, message?: string) {
  const current = tasks.get(task.taskId)!;
  const state: TaskState = {
    ...current,
    status: 'completed',
    progress: 100,
    message: message || `${task.label} completed`,
    completedAt: new Date().toISOString()
  };
  tasks.set(task.taskId, state);
  broadcastTask({ type: 'update', task: state });
}

export function failTask(task: TaskDefinition, error: string) {
  const current = tasks.get(task.taskId)!;
  const state: TaskState = {
    ...current,
    status: 'error',
    error,
    message: error,
    completedAt: new Date().toISOString()
  };
  tasks.set(task.taskId, state);
  broadcastTask({ type: 'update', task: state });
}

export function subscribeTasks(callback: TaskSubscriber, sendSnapshot = true) {
  taskSubscribers.add(callback);
  if (sendSnapshot) {
    callback({ type: 'snapshot', tasks: getTaskStates() });
  }
}

export function unsubscribeTasks(callback: TaskSubscriber) {
  taskSubscribers.delete(callback);
}

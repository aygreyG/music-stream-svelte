import type { DbLogEntry, LogEntry, LogEvent } from '$lib/shared/types';

type LogSubscriber = (event: LogEvent) => void;

const logSubscribers: Set<LogSubscriber> = new Set();

function broadcastLogEvent(event: LogEvent) {
  for (const subscriber of logSubscribers) {
    try {
      subscriber(event);
    } catch {
      logSubscribers.delete(subscriber);
    }
  }
}

export function subscribeLogs(callback: LogSubscriber) {
  logSubscribers.add(callback);
}

export function unsubscribeLogs(callback: LogSubscriber) {
  logSubscribers.delete(callback);
}

export function broadcastLog(log: LogEntry) {
  broadcastLogEvent({ type: 'log', log });
}

export function broadcastDbLog(dbLog: DbLogEntry) {
  broadcastLogEvent({ type: 'dbLog', dbLog });
}

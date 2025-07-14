import type { FolderNode } from '$lib/shared/types';
import { createReadStream, existsSync } from 'fs';
import { lstat, readdir, appendFile } from 'fs/promises';
import { join } from 'path';

const LOG_FILE = 'db/server.log';

type LogLevel = 'info' | 'warn' | 'error';

export async function getSubFolders(dir: string): Promise<FolderNode[]> {
  const subFolders: FolderNode[] = [];

  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const path = join(dir, file);
      const stats = await lstat(path);
      if (stats.isDirectory()) {
        const folderName = path.split('/').pop()!;

        subFolders.push({
          label: folderName,
          children: [],
          path
        });
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err}`);
  }

  return subFolders;
}

const colorMap = {
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m' // Red
};

const resetColor = '\x1b[0m';

export function serverLog(message: string | object, level: LogLevel = 'info') {
  const now = new Date();
  const timestamp =
    now.toLocaleString('en-GB', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + `.${now.getMilliseconds()}`;

  const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
  const logEntry = `${level};${timestamp};${formattedMessage}\n`;

  console.log(
    `${colorMap[level]}[${level.toUpperCase()}]${resetColor}[${timestamp}] ${formattedMessage}`
  );

  appendFile(LOG_FILE, logEntry).catch((err) => {
    console.error(`Failed to write to log file: ${err}`);
  });
}

export function getLog() {
  return new Promise<
    {
      level: LogLevel;
      timestamp: string | null;
      message: string;
    }[]
  >((resolve, reject) => {
    if (!existsSync(LOG_FILE)) {
      serverLog('Log file does not exist so creating a new one.', 'info');
      return resolve([]);
    }

    const logStream = createReadStream(LOG_FILE, { encoding: 'utf-8' });
    let data = '';

    logStream.on('data', (chunk) => {
      data += chunk;
    });

    logStream.on('end', () => {
      const lines = data.split('\n').filter((line) => line.trim() !== '');

      const formattedLines = lines.map((line) => {
        const parts = line.split(';');
        if (parts.length < 3)
          return {
            level: 'info' as const,
            timestamp: null,
            message: line.trim()
          };

        const [level, timestamp, ...messageParts] = parts;
        return {
          level: level.trim() as LogLevel,
          timestamp: timestamp.trim(),
          message: messageParts.join(';').trim()
        };
      });

      resolve(formattedLines.toReversed());
    });

    logStream.on('error', (err) => {
      reject(err);
    });
  });
}

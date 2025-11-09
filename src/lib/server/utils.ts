import type { FolderNode } from '$lib/shared/types';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { lstat, readdir, appendFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from './prisma';
import archiver from 'archiver';
import { EXCLUDE_FILES_STARTING_WITH } from '$lib/shared/consts';

const LOG_FILE = 'db/logs/<placeholder>-server.log';
const ZIP_FILE = 'db/logs/<placeholder>-server-log.zip';
const MAX_LOG_FILES = 10;

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

export async function serverLog(message: string | object, level: LogLevel = 'info') {
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

  if (level !== 'info') {
    await prisma.log.create({
      data: {
        level,
        message: formattedMessage
      }
    });
  }

  if (!existsSync('db/logs')) {
    await mkdir('db/logs', { recursive: true });
  }

  const logFolderFiles = await readdir('db/logs');
  const logFiles = logFolderFiles.filter((file) => file.endsWith('-server.log'));

  if (logFiles.length > MAX_LOG_FILES) {
    try {
      const filesToZip = logFiles.slice(0, logFiles.length - MAX_LOG_FILES);
      const archive = archiver('zip', { zlib: { level: 9 } });
      const fromTo = filesToZip.map((f) => f.replace('-server.log', '')).sort();
      const output = createWriteStream(
        ZIP_FILE.replace('<placeholder>', `${fromTo[0]}-${fromTo[fromTo.length - 1]}`)
      );

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);

      for (const file of filesToZip) {
        archive.file(join('db/logs', file), { name: file });
      }

      await archive.finalize();
      // delete zipped files
      for (const file of filesToZip) {
        await rm(join('db/logs', file));
      }
    } catch (e) {
      console.error(`Failed to archive old log files: ${e}`);
    }
  }

  // we should append to a logfile that is for the current day
  const logFile = LOG_FILE.replace('<placeholder>', now.toISOString().split('T')[0]);

  if (!existsSync('db/logs')) {
    await mkdir('db/logs', { recursive: true });
  }

  appendFile(logFile, logEntry).catch((err) => {
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
    if (!existsSync('db/logs')) {
      mkdir('db/logs', { recursive: true }).then(() => {
        serverLog('Log folder did not exist so created a new one.', 'info');
        resolve([]);
      });
      return;
    }

    const logFile = LOG_FILE.replace('<placeholder>', new Date().toISOString().split('T')[0]);

    if (!existsSync(logFile)) {
      serverLog('Log file does not exist so creating a new one.', 'info');
      return resolve([]);
    }

    const logStream = createReadStream(logFile, { encoding: 'utf-8' });
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

export async function getLogFiles() {
  if (!existsSync('db/logs')) {
    await mkdir('db/logs', { recursive: true });
  }

  const logFiles = await readdir('db/logs');
  return logFiles.filter((file) => file.endsWith('-server.log'));
}

export async function getLogZips() {
  if (!existsSync('db/logs')) {
    await mkdir('db/logs', { recursive: true });
  }

  const logZips = await readdir('db/logs');
  return logZips.filter((file) => file.endsWith('-server-log.zip'));
}

export const errorToNull = async <T>(
  promise: Promise<T>,
  errorMessage?: string,
  includeError = false
): Promise<T | null> => {
  try {
    return await promise;
  } catch (e) {
    let em = `Error occurred: ${errorMessage || e}`;

    if (includeError) {
      em += ` - Thrown Error: ${e}`;
    }

    serverLog(em, 'error');
    return null;
  }
};

export function isFileNameValid(fileName: string) {
  return EXCLUDE_FILES_STARTING_WITH.every((prefix) => !fileName.startsWith(prefix));
}

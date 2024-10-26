import type { FolderNode } from '$lib/shared/types';
import { lstat, readdir } from 'fs/promises';
import { join } from 'path';

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

export function serverLog(message: string | object, level: 'info' | 'warn' | 'error' = 'info') {
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

  const colorMap = {
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m' // Red
  };
  const resetColor = '\x1b[0m';

  const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
  console.log(
    `${colorMap[level]}[${level.toUpperCase()}]${resetColor}[${timestamp}] ${formattedMessage}`
  );
}

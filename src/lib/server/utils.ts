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

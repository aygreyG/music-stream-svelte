import { register } from '$lib/server/auth.js';
import { completeServerSetup, createServerSettings } from '$lib/server/serverSettings';
import type { FolderNode } from '$lib/shared/types.js';
import { fail, type Actions } from '@sveltejs/kit';
import { readdir, lstat } from 'fs/promises';
import { join } from 'path';

async function getSubFolders(dir: string): Promise<FolderNode[]> {
  const subFolders: FolderNode[] = [];

  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const path = join(dir, file);
      const stats = await lstat(path);
      if (stats.isDirectory()) {
        const folderName = path.split('/').pop()!;
        // const subSubFolders = await getSubFolders(path);
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

export const load = async () => {
  const musicFolders: FolderNode[] = [];

  const dir = '/';

  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const path = join(dir, file);
      const stats = await lstat(path);
      if (stats.isDirectory()) {
        const folderName = path.split('/').pop()!;
        const subFolders = await getSubFolders(path);
        musicFolders.push({ label: folderName, path, children: subFolders });
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err}`);
  }

  return {
    musicFolders,
    title: 'Setup'
  };
};

export const actions: Actions = {
  createsetup: async ({ request }) => {
    const form = await request.formData();
    const folder = form.get('musicFolder');

    if (!folder?.toString()) {
      return fail(401, { error: 'folder is required' });
    }

    const settings = await createServerSettings(folder.toString());

    const username = form.get('username')?.toString();
    const password = form.get('password')?.toString();
    const email = form.get('email')?.toString();

    if (!username || !password || !email) {
      return fail(401, {
        error: 'username, email and password are required'
      });
    }

    try {
      await register(email, password, password, username, 'OWNER');
      await completeServerSetup(settings);
    } catch (err) {
      return fail(401, { error: (err as Error)?.message });
    }
  },
  getchildren: async ({ request }) => {
    const form = await request.formData();
    const path = form.get('path')?.toString();
    if (!path) return fail(401, { error: 'path is required' });
    const subFolders = await getSubFolders(path);
    return {
      body: subFolders
    };
  }
};

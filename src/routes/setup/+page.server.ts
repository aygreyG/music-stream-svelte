import { register } from '$lib/server/auth.js';
import prisma from '$lib/server/prisma';
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

  const owner = await prisma.user.findFirst({
    where: {
      role: 'OWNER'
    }
  });

  const dir = '/';

  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const path = join(dir, file);
      const stats = await lstat(path);
      if (stats.isDirectory()) {
        const folderName = path.split('/').pop()!;
        musicFolders.push({ label: folderName, path, children: [] });
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err}`);
  }

  return {
    musicFolders,
    title: 'Setup',
    hasOwner: !!owner
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
    const owner = await prisma.user.findFirst({
      where: {
        role: 'OWNER'
      }
    });

    if (owner) {
      return completeServerSetup(settings);
    }

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
      prisma.serverSettings.delete({
        where: {
          id: settings.id
        }
      });
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
  },
  deleteowner: async () => {
    await prisma.user.deleteMany({
      where: {
        role: 'OWNER'
      }
    });
  }
};

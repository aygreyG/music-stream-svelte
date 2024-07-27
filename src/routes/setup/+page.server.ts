import { register } from '$lib/server/auth.js';
import { env } from '$env/dynamic/private';
import prisma from '$lib/server/prisma';
import { completeServerSetup, createServerSettings } from '$lib/server/serverSettings';
import type { FolderNode } from '$lib/shared/types.js';
import { fail, type Actions } from '@sveltejs/kit';
import { readdir, lstat } from 'fs/promises';
import { join } from 'path';
import { getSubFolders } from '$lib/server/utils';

export const load = async () => {
  const owner = await prisma.user.findFirst({
    where: {
      role: 'OWNER'
    }
  });

  const dir = env.MUSIC_PATH || '/';
  const defaultFolder: FolderNode = {
    label: dir !== '/' ? dir.split('/').pop()! : '/',
    path: dir,
    children: []
  };
  const musicFolders = await getSubFolders(defaultFolder.path);
  defaultFolder.children = musicFolders;

  return {
    title: 'Setup',
    hasOwner: !!owner,
    defaultFolder
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
  deleteowner: async () => {
    await prisma.user.deleteMany({
      where: {
        role: 'OWNER'
      }
    });
  }
};

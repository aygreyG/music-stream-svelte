import { getServerSettings } from '$lib/server/serverSettings';
import type { TaskDefinition } from '$lib/shared/types';
import { completeTask, failTask, isAnyTaskRunning, startTask } from '../taskManager';
import prisma from '../../prisma';
import librarySync from './librarySync';

const definition: TaskDefinition = {
  taskId: 'full-library-sync',
  label: 'Full Library Sync',
  description:
    'This will reset the entire library and sync all tracks. Using this will cause all existing metadata (play counts, playlist entries, etc.) to be lost.',
  execute: runFullLibrarySync
};

/**
 * Runs a full library synchronization process.
 * Deletes all existing tracks, albums, and artists from the database
 * and then initiates a new library synchronization.
 */
async function runFullLibrarySync() {
  const settings = await getServerSettings();
  if (isAnyTaskRunning() || !settings?.setupComplete) {
    return;
  }

  startTask(definition, 'Clearing database.');

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.track.deleteMany();
        await tx.album.deleteMany();
        await tx.artist.deleteMany();
      },
      { maxWait: 5000, timeout: 10000 }
    );

    completeTask(definition, 'Database cleared, starting sync.');
  } catch (err) {
    failTask(definition, `Failed to clear database: ${err}`);
    return;
  }

  librarySync.execute();
}

export default definition;

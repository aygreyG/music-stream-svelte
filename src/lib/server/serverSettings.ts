import type { ServerSettings } from '@prisma/client';
import prisma from './prisma';
import { runLibrarySync } from './librarySync';
import crypto from 'node:crypto';

let serverSettings: ServerSettings | null = null;
let requestedServerSettings = false;

export async function createServerSettings(folderPath: string) {
  const newSettings = await prisma.serverSettings.create({
    data: {
      musicFolder: folderPath,
      jwtSecret: crypto.randomBytes(32).toString('hex')
    }
  });

  serverSettings = newSettings;

  return newSettings;
}

export async function completeServerSetup(sSettings: ServerSettings) {
  const updatedSettings = await prisma.serverSettings.update({
    where: {
      id: sSettings.id
    },
    data: {
      setupComplete: true
    }
  });

  serverSettings = updatedSettings;
  runLibrarySync();
}

export async function getServerSettings() {
  if (serverSettings) {
    return serverSettings;
  }

  if (!requestedServerSettings) {
    try {
      const settings = await prisma.serverSettings.findFirst();
      serverSettings = settings;
      requestedServerSettings = true;
    } catch (err) {
      console.error('Error getting server settings: ');
      console.error(err);
    }
  }

  return serverSettings;
}

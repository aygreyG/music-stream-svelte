import { parseFile } from 'music-metadata';
import prisma from './prisma';
import { serverLog } from './utils';

export function cleanUpTags(tags: string[]) {
  const cleanedTags: string[] = [];

  tags.forEach((tag) =>
    tag
      .split(/,|;|\//)
      .forEach((g) => cleanedTags.push(g.replaceAll('-', ' ').trim().toLowerCase()))
  );

  return cleanedTags;
}

let regenerationInProgress = false;

export function isRegenerationInProgress() {
  return regenerationInProgress;
}

export async function startRegeneration() {
  regenerationInProgress = true;

  serverLog('Starting tag regeneration...');

  const tracks = await prisma.track.findMany({
    select: {
      id: true,
      filePath: true
    }
  });

  await prisma.tag.deleteMany();

  for (const track of tracks) {
    try {
      const metadata = await parseFile(track.filePath);
      const newTags = metadata.common.genre || [];
      const cleanedTags = cleanUpTags(newTags);

      await prisma.track.update({
        where: { id: track.id },
        data: {
          tags: {
            connectOrCreate: cleanedTags.map((tag) => ({
              where: { name: tag },
              create: { name: tag }
            }))
          }
        }
      });
    } catch (err) {
      serverLog(`Error processing file ${track.filePath}: ${err}`, 'error');
    }
  }

  serverLog('Tag regeneration completed.');

  regenerationInProgress = false;
}

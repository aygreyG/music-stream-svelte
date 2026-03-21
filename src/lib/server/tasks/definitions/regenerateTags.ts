import { parseFile } from 'music-metadata';
import prisma from '../../prisma';
import { cleanUpTags, serverLog } from '../../utils';
import { isAnyTaskRunning, startTask, updateTask, completeTask, failTask } from '../taskManager';

const definition = {
  taskId: 'tag-regeneration',
  label: 'Regenerate Tags',
  description:
    'This will delete all existing tags and will re-parse all tracks to generate new tags.',
  execute: regenerateTags
};

async function regenerateTags() {
  if (isAnyTaskRunning()) return;

  startTask(definition, 'Loading tracks.');
  serverLog('Starting tag regeneration...');

  try {
    const tracks = await prisma.track.findMany({
      select: {
        id: true,
        filePath: true
      }
    });

    await prisma.tag.deleteMany();

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
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

      const progress = Math.round(((i + 1) / tracks.length) * 100);
      updateTask(definition, {
        progress,
        message: `Processing ${i + 1}/${tracks.length} tracks.`
      });
    }

    serverLog('Tag regeneration completed.');
    completeTask(definition, `Completed - ${tracks.length} tracks processed.`);
  } catch (err) {
    serverLog(`Tag regeneration failed: ${err}`, 'error');
    failTask(definition, `Tag regeneration failed: ${err}`);
  }
}

export default definition;

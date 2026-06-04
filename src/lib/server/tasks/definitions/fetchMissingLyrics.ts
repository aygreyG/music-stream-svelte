import type { TaskDefinition } from '$lib/shared/types';

import { getLyricsForTrack } from '../../lyrics';
import prisma from '../../prisma';
import { serverLog } from '../../utils';
import { completeTask, failTask, isAnyTaskRunning, startTask, updateTask } from '../taskManager';

const LYRICS_FETCH_DELAY_MS = 500;
const LYRICS_MAX_CONCURRENT = 3;

const definition: TaskDefinition = {
  taskId: 'fetch-missing-lyrics',
  label: 'Fetch Missing Lyrics',
  description:
    'This will fetch lyrics from lrclib.net for tracks without synced lyrics (skips instrumentals). This may take a long time.',
  execute: async () => {
    if (isAnyTaskRunning()) return;

    const tracks = await prisma.track.findMany({
      where: {
        OR: [{ lyrics: null }, { lyrics: { AND: { syncedLyrics: null, instrumental: false } } }]
      },
      select: { id: true }
    });

    startTask(definition, `Processing 0/${tracks.length} tracks.`);
    serverLog('Starting fetch missing lyrics task', 'info');

    let processed = 0;
    let found = 0;
    const trackIds = tracks.map((t) => t.id);

    try {
      await processWithRateLimit(trackIds, async (trackId) => {
        const result = await getLyricsForTrack(trackId, false);
        if (result.found) found++;
        processed++;

        const progress = Math.round((processed / tracks.length) * 100);
        updateTask(definition, {
          progress,
          message: `Processing ${processed}/${tracks.length} tracks. Found: ${found}`
        });
      });

      serverLog('Finished fetch missing lyrics task', 'info');
      completeTask(definition, `Completed - ${processed} tracks processed, ${found} lyrics found.`);
    } catch (err) {
      serverLog(`Fetch missing lyrics failed: ${err}`, 'error');
      failTask(definition, `Fetch missing lyrics failed: ${err}`);
    }
  }
};

async function processWithRateLimit<T>(
  items: T[],
  processor: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      await processor(items[currentIndex]);
      await new Promise((resolve) => setTimeout(resolve, LYRICS_FETCH_DELAY_MS));
    }
  }

  const workers = Array.from({ length: LYRICS_MAX_CONCURRENT }, () => worker());
  await Promise.all(workers);
}

export default definition;

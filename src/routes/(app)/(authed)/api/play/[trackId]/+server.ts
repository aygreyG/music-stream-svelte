import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import { stat } from 'fs/promises';
import { createReadStream } from 'fs';
import type { Track } from '@prisma/client';

const cache = new Map<string, Track & { lastAccessed: Date }>();

async function getTrack(trackId: string) {
  if (cache.has(trackId)) {
    const track = cache.get(trackId) as Track & { lastAccessed: Date };
    track.lastAccessed = new Date();
    cache.set(trackId, track);
    return cache.get(trackId);
  }

  const track = await prisma.track.findUnique({
    where: {
      id: trackId
    }
  });

  if (!track) {
    return null;
  }

  cache.set(trackId, { ...track, lastAccessed: new Date() });

  if (cache.size > 100) {
    const oldest = [...cache.values()].sort(
      (a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime()
    )[0];
    cache.delete(oldest.id);
  }

  return track;
}

export const GET = async ({ params, request, setHeaders }) => {
  const { trackId } = params;

  const track = await getTrack(trackId);

  if (!track) {
    error(404, {
      message: 'Track not found'
    });
  }

  const range = request.headers.get('Range');

  if (!range) {
    error(400, {
      message: 'Range header not found'
    });
  }

  try {
    const audiostat = await stat(track.filePath);
    const audioSize = audiostat.size;
    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, audioSize - 1);
    const contentLength = end - start + 1;

    setHeaders({
      'Content-Range': `bytes ${start}-${end}/${audioSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength.toString(),
      'Content-Type': 'audio/*'
    });

    const audioStream = createReadStream(track.filePath, { start, end });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(audioStream as any, {
      status: 206
    });
  } catch (e) {
    console.error(e);
    error(500, {
      message: 'Internal server error'
    });
  }
};

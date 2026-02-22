import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import { stat } from 'fs/promises';
import { createReadStream } from 'fs';
import type { Prisma } from '../../../../../../generated/prisma-client/client';

type TrackType = Prisma.TrackGetPayload<{ select: { filePath: true; id: true } }>;

const cache = new Map<string, TrackType>();

async function getTrack(trackId: string) {
  if (cache.has(trackId)) {
    // Move to end of Map (most recently used) by re-inserting
    const track = cache.get(trackId)!;
    cache.delete(trackId);
    cache.set(trackId, track);
    return track;
  }

  const track = await prisma.track.findUnique({
    where: {
      id: trackId
    },
    select: {
      id: true,
      filePath: true
    }
  });

  if (!track) {
    return null;
  }

  cache.set(trackId, track);

  if (cache.size > 100) {
    // Delete the oldest entry (first key in Map iteration order)
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  return track;
}

export const GET = async ({ params, request, setHeaders }) => {
  const { trackId } = params;
  const track = await getTrack(trackId);
  const headers: Record<string, string> = {};

  if (!track) {
    error(404, {
      message: 'Track not found'
    });
  }

  const contentType = track.filePath.split('.').pop();
  headers['content-type'] = `audio/${contentType}`;

  const range = request.headers.get('range');
  const audioStat = await stat(track.filePath);
  const contentLength = audioStat.size;

  let statusCode = 206;
  let start;
  let end;

  try {
    if (range) {
      const bytesPrefix = 'bytes=';
      if (range.startsWith(bytesPrefix)) {
        const bytesRange = range.substring(bytesPrefix.length);
        const parts = bytesRange.split('-');
        if (parts.length === 2) {
          const rangeStart = parts[0] && parts[0].trim();
          if (rangeStart && rangeStart.length > 0) {
            start = parseInt(rangeStart);
          }
          const rangeEnd = parts[1] && parts[1].trim();
          if (rangeEnd && rangeEnd.length > 0) {
            end = parseInt(rangeEnd);
          }
        }
      }
    }

    let retrievedLength;

    if (start !== undefined && end !== undefined) {
      retrievedLength = end + 1 - start;
    } else if (start !== undefined) {
      retrievedLength = contentLength - start;
    } else if (end !== undefined) {
      retrievedLength = end + 1;
    } else {
      retrievedLength = contentLength;
    }

    statusCode = start !== undefined || end !== undefined ? 206 : 200;

    if (range) {
      headers['content-range'] = `bytes ${start || 0}-${end || contentLength - 1}/${contentLength}`;
      headers['accept-ranges'] = 'bytes';
    }

    headers['content-length'] = retrievedLength.toString();
    setHeaders(headers);
    const fileStream = createReadStream(track.filePath, { start, end });
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of fileStream) {
          controller.enqueue(chunk);
        }
      }
    });

    return new Response(stream, {
      status: statusCode
    });
  } catch (e) {
    console.error(e);
    error(500, {
      message: 'Internal server error'
    });
  }
};

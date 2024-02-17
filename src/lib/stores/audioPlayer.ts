import type { Prisma } from '@prisma/client';
import { writable } from 'svelte/store';

type TrackType = Prisma.TrackGetPayload<{
  include: { artists: true; album: { include: { albumArtist: true } } };
}>;

export const paused = writable(true);
export const currentTrack = writable<TrackType | null>(null);

const queueContext = writable<TrackType[]>([]);
const queueContextIndex = writable<number>(0);

export async function playTrack(context: TrackType[], index: number) {
  queueContextIndex.set(index);
  queueContext.set(context);
  currentTrack.set(context[index]);
}

export async function playNext() {
  queueContextIndex.update((i) => {
    let newIndex = i;

    queueContext.subscribe((context) => {
      if (i + 1 < context.length) {
        newIndex++;
        currentTrack.set(context[newIndex]);
      }
    });

    return newIndex;
  });
}

export async function playPrevious() {
  queueContextIndex.update((i) => {
    let newIndex = i;

    queueContext.subscribe((context) => {
      if (i - 1 >= 0) {
        newIndex--;
        currentTrack.set(context[newIndex]);
      }
    });

    return newIndex;
  });
}

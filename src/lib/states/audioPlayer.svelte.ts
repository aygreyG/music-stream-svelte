import { getContext, setContext } from 'svelte';

import type { Prisma } from '../../generated/prisma-client/client';

type TrackType = Prisma.TrackGetPayload<{
  select: {
    id: true;
    title: true;
    artists: {
      select: {
        id: true;
        name: true;
      };
    };
    album: {
      select: {
        id: true;
        title: true;
        albumArtist: {
          select: {
            id: true;
            name: true;
          };
        };
        albumArtId: true;
        albumArt: true;
      };
    };
  };
}>;

type PlaylistInfoType = {
  title: string;
  id: string;
};

function createAudioPlayer() {
  let paused: boolean = $state(true);
  let currentTrack: TrackType | null = $state(null);
  let playlistInfo: PlaylistInfoType | null = $state(null);
  let queueContext: TrackType[] = $state([]);
  let queueContextIndex: number = $state(0);
  let fullScreenQueueOpen = $state(false);
  const hasNext = $derived(queueContextIndex < queueContext.length - 1);
  const hasPrevious = $derived(queueContextIndex > 0);

  function playTrack(
    context: TrackType[],
    index: number,
    instant: boolean = true,
    playlistInfoParam: PlaylistInfoType | null = null
  ) {
    queueContextIndex = index;
    queueContext = context;
    currentTrack = context[index];
    if (instant) {
      paused = false;
    }
    playlistInfo = playlistInfoParam;
  }

  function playNext() {
    if (queueContextIndex + 1 < queueContext.length) {
      queueContextIndex++;
      currentTrack = queueContext[queueContextIndex];
    }
  }

  function playPrevious() {
    if (queueContextIndex - 1 >= 0) {
      queueContextIndex--;
      currentTrack = queueContext[queueContextIndex];
    }
  }

  function playAtIndex(index: number) {
    if (index >= 0 && index < queueContext.length) {
      queueContextIndex = index;
      currentTrack = queueContext[queueContextIndex];
    }
  }

  function togglePlay() {
    if (currentTrack) {
      paused = !paused;
    }
  }

  function stopAndClear() {
    paused = true;
    queueContextIndex = 0;
    queueContext = [];
    currentTrack = null;
    playlistInfo = null;
  }

  function removeFromQueue(trackId: string) {
    const index = queueContext.findIndex((t) => t.id === trackId);
    if (index === -1) return;

    const newQueue = queueContext.filter((t) => t.id !== trackId);

    if (newQueue.length === 0) {
      stopAndClear();
      return;
    }

    if (index === queueContextIndex) {
      // Removed the currently playing track
      const newIndex = Math.min(queueContextIndex, newQueue.length - 1);
      queueContext = newQueue;
      queueContextIndex = newIndex;
      currentTrack = newQueue[newIndex];
    } else {
      queueContext = newQueue;
      if (index < queueContextIndex) {
        queueContextIndex--;
      }
    }
  }

  function addToQueue(track: TrackType) {
    queueContext = [...queueContext, track];
  }

  function updateQueueContext(newContext: TrackType[]) {
    if (newContext.length === 0) {
      stopAndClear();
      return;
    }

    if (currentTrack) {
      const newIndex = newContext.findIndex((t) => t.id === currentTrack!.id);
      if (newIndex !== -1) {
        queueContext = newContext;
        queueContextIndex = newIndex;
      } else {
        // Current track no longer in queue
        const safeIndex = Math.min(queueContextIndex, newContext.length - 1);
        queueContext = newContext;
        queueContextIndex = safeIndex;
        currentTrack = newContext[safeIndex];
      }
    } else {
      queueContext = newContext;
      queueContextIndex = 0;
    }
  }

  return {
    togglePlay,
    playNext,
    playPrevious,
    playAtIndex,
    playTrack,
    stopAndClear,
    removeFromQueue,
    addToQueue,
    updateQueueContext,
    get paused() {
      return paused;
    },
    set paused(value: boolean) {
      paused = value;
    },
    get currentTrack() {
      return currentTrack;
    },
    get queueContext() {
      return queueContext;
    },
    get queueContextIndex() {
      return queueContextIndex;
    },
    get hasNext() {
      return hasNext;
    },
    get hasPrevious() {
      return hasPrevious;
    },
    get playlistInfo() {
      return playlistInfo;
    },
    get fullScreenQueueOpen() {
      return fullScreenQueueOpen;
    },
    set fullScreenQueueOpen(value: boolean) {
      fullScreenQueueOpen = value;
    }
  };
}

const PLAYER_KEY = Symbol('audioPlayer');

export function setAudioPlayer() {
  return setContext(PLAYER_KEY, createAudioPlayer());
}

export function getAudioPlayer() {
  return getContext<ReturnType<typeof setAudioPlayer>>(PLAYER_KEY);
}

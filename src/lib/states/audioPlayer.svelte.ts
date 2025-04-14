import type { Prisma } from 'prisma-client';
import { getContext, setContext } from 'svelte';

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
        albumArtAccent: true;
      };
    };
  };
}>;

function createAudioPlayer() {
  let paused: boolean = $state(true);
  let currentTrack: TrackType | null = $state(null);
  let queueContext: TrackType[] = $state([]);
  let queueContextIndex: number = $state(0);

  function playTrack(context: TrackType[], index: number, instant: boolean = true) {
    queueContextIndex = index;
    queueContext = context;
    currentTrack = context[index];
    if (instant) {
      paused = false;
    }
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

  function togglePlay() {
    if (currentTrack) {
      paused = !paused;
    }
  }

  return {
    togglePlay,
    playNext,
    playPrevious,
    playTrack,
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

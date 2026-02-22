import type { Prisma } from '../../generated/prisma-client/client';
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

  return {
    togglePlay,
    playNext,
    playPrevious,
    playAtIndex,
    playTrack,
    stopAndClear,
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

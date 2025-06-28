import type { Prisma } from '../../generated/prisma-client/client';
import { getContext, setContext } from 'svelte';
import { theme } from './theme.svelte';

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
        albumArtDarkMuted: true;
        albumArtVibrant: true;
        albumArtMuted: true;
        albumArtLightVibrant: true;
        albumArtLightMuted: true;
        albumArtDarkVibrant: true;
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
    theme.background = currentTrack?.album?.albumArtMuted || null;
    if (instant) {
      paused = false;
    }
  }

  function playNext() {
    if (queueContextIndex + 1 < queueContext.length) {
      queueContextIndex++;
      currentTrack = queueContext[queueContextIndex];
      theme.background = currentTrack?.album?.albumArtMuted || null;
    }
  }

  function playPrevious() {
    if (queueContextIndex - 1 >= 0) {
      queueContextIndex--;
      currentTrack = queueContext[queueContextIndex];
      theme.background = currentTrack?.album?.albumArtMuted || null;
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

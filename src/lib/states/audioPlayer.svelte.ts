import type { Prisma } from '@prisma/client';
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

class AudioPlayer {
  paused: boolean = $state(true);
  currentTrack: TrackType | null = $state(null);
  queueContext: TrackType[] = $state([]);
  queueContextIndex: number = $state(0);

  playTrack(context: TrackType[], index: number) {
    this.queueContextIndex = index;
    this.queueContext = context;
    this.currentTrack = context[index];
  }

  playNext() {
    if (this.queueContextIndex + 1 < this.queueContext.length) {
      this.queueContextIndex++;
      this.currentTrack = this.queueContext[this.queueContextIndex];
    }
  }

  playPrevious() {
    if (this.queueContextIndex - 1 >= 0) {
      this.queueContextIndex--;
      this.currentTrack = this.queueContext[this.queueContextIndex];
    }
  }

  togglePlay() {
    if (this.currentTrack) {
      this.paused = !this.paused;
    }
  }
}

const PLAYER_KEY = Symbol('audioPlayer');

export function setAudioPlayer() {
  return setContext(PLAYER_KEY, new AudioPlayer());
}

export function getAudioPlayer() {
  return getContext<ReturnType<typeof setAudioPlayer>>(PLAYER_KEY);
}

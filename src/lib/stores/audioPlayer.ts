import type { Prisma } from '@prisma/client';
import { writable } from 'svelte/store';

type AlbumType = Prisma.AlbumGetPayload<{
  include: { albumArtist: true; tracks: { include: { artists: true } } };
}>;
type TrackType = Prisma.TrackGetPayload<{ include: { artists: true } }>;

export const queue = writable<{ track: TrackType; album: AlbumType }[]>([]);

export const previous = writable<{ track: TrackType; album: AlbumType }[]>([]);

export const currentTrack = writable<{
  track: TrackType;
  album: AlbumType;
  shouldBePlayed: boolean;
} | null>(null);

export const paused = writable(true);

export async function playTrack(track: TrackType, album: AlbumType, shouldBePlayed = true) {
  if (shouldBePlayed) {
    currentTrack.update((t) => {
      if (t) {
        previous.update((p) => [...p, t]);
      }

      return { track, album, shouldBePlayed };
    });
  } else {
    queue.update((q) => {
      if (q.length === 0) {
        currentTrack.set({ track, album, shouldBePlayed });
        return q;
      }

      return [...q, { track, album }];
    });
  }
}

export async function playNext() {
  queue.update((q) => {
    if (q.length === 0) {
      currentTrack.update((t) => {
        if (t) {
          const nextTrack = t.album.tracks.find(
            (track) => track.trackNumber === t.track.trackNumber + 1
          );

          if (nextTrack) {
            previous.update((p) => [...p, t]);
            return {
              track: nextTrack,
              album: t.album,
              shouldBePlayed: true
            };
          }
        }

        return t;
      });

      return q;
    }

    const [next, ...rest] = q;
    currentTrack.update((t) => {
      if (t) {
        previous.update((p) => [...p, t]);
      }

      return {
        track: next.track,
        album: next.album,
        shouldBePlayed: true
      };
    });
    return rest;
  });
}

export async function playPrevious() {
  previous.update((p) => {
    if (p.length === 0) {
      currentTrack.update((t) => {
        if (t) {
          const previousTrack = t.album.tracks.find(
            (track) => track.trackNumber === t.track.trackNumber - 1
          );

          if (previousTrack) {
            return {
              track: previousTrack,
              album: t.album,
              shouldBePlayed: true
            };
          }
        }

        return t;
      });

      return p;
    }

    const previousTrack = p.pop();

    if (previousTrack) {
      currentTrack.set({
        track: previousTrack.track,
        album: previousTrack.album,
        shouldBePlayed: true
      });
    }

    return p;
  });
}

export async function playAlbum(album: AlbumType) {
  queue.set(album.tracks.map((track) => ({ track, album })));
  playNext();
}

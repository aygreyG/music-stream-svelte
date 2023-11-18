import type { Prisma } from '@prisma/client';
import { writable } from 'svelte/store';

type AlbumType = Prisma.AlbumGetPayload<{
	include: { albumArtist: true; tracks: { include: { artists: true } } };
}>;
type TrackType = Prisma.TrackGetPayload<{ include: { artists: true } }>;

export const queue = writable<{ track: TrackType; album: AlbumType }[]>([]);

export const currentTrack = writable<{
	track: TrackType;
	album: AlbumType;
	shouldBePlayed: boolean;
} | null>(null);

export async function playTrack(track: TrackType, album: AlbumType, shouldBePlayed = true) {
	if (shouldBePlayed) {
		currentTrack.set({ track, album, shouldBePlayed });
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
			return q;
		}

		const [next, ...rest] = q;
		currentTrack.set({ track: next.track, album: next.album, shouldBePlayed: true });
		return rest;
	});
}

export async function playAlbum(album: AlbumType) {
	queue.set(album.tracks.map((track) => ({ track, album })));
	playNext();
}

import prisma from './prisma';
import { serverLog } from './utils';

interface LrclibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

const LRCLIB_BASE = 'https://lrclib.net/api';

const inFlightRequests = new Map<string, Promise<LyricsResult>>();

async function searchLrclib(
  title: string,
  artistName: string,
  albumName: string,
  duration: number
): Promise<{
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental: boolean;
} | null> {
  const params = new URLSearchParams({
    track_name: title,
    artist_name: artistName
  });

  try {
    const res = await fetch(`${LRCLIB_BASE}/search?${params}`, {
      headers: {
        'User-Agent': 'music-stream-svelte (https://github.com/aygreyg/music-stream-svelte)'
      }
    });

    if (!res.ok) {
      serverLog(`LRCLIB search error: ${res.status} ${res.statusText}`, 'warn');
      return null;
    }

    const results: LrclibSearchResult[] = await res.json();
    if (!results.length) return null;

    const scored = results.map((r) => {
      let score = 0;

      const durDiff = Math.abs(r.duration - duration);
      if (durDiff <= 3) {
        score += Math.max(0, 30 - durDiff * 10);
      }

      const rAlbum = (r.albumName || '').toLowerCase();
      const tAlbum = albumName.toLowerCase();
      if (rAlbum === tAlbum) {
        score += 20;
      } else if (rAlbum.includes(tAlbum) || tAlbum.includes(rAlbum)) {
        score += 10;
      }

      if (r.instrumental) {
        score += 5;
      } else if (r.syncedLyrics) {
        score += 40;
      } else if (r.plainLyrics) {
        score += 20;
      }

      if (r.trackName.toLowerCase() === title.toLowerCase()) {
        score += 10;
      }

      return { ...r, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best || best.score <= 0) return null;

    return {
      plainLyrics: best.plainLyrics ?? null,
      syncedLyrics: best.syncedLyrics ?? null,
      instrumental: best.instrumental
    };
  } catch (err) {
    serverLog(`Failed to search LRCLIB: ${err}`, 'warn');
    return null;
  }
}

export interface LyricsResult {
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental: boolean;
  found: boolean;
}

export async function getLyricsForTrack(trackId: string, force = false): Promise<LyricsResult> {
  if (!force) {
    const cached = await prisma.lyrics.findUnique({ where: { trackId } });
    if (cached?.instrumental) {
      return {
        plainLyrics: null,
        syncedLyrics: null,
        instrumental: true,
        found: true
      };
    }
    if (cached?.syncedLyrics || cached?.plainLyrics) {
      return {
        plainLyrics: cached.plainLyrics,
        syncedLyrics: cached.syncedLyrics,
        instrumental: false,
        found: true
      };
    }
  }

  const existing = inFlightRequests.get(trackId);
  if (existing) return existing;

  const promise = fetchLyricsFromApi(trackId);
  inFlightRequests.set(trackId, promise);

  try {
    return await promise;
  } finally {
    inFlightRequests.delete(trackId);
  }
}

async function fetchLyricsFromApi(trackId: string): Promise<LyricsResult> {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: {
      title: true,
      length: true,
      album: { select: { title: true } },
      artists: { select: { name: true }, take: 1 }
    }
  });

  if (!track) {
    return { plainLyrics: null, syncedLyrics: null, instrumental: false, found: false };
  }

  const artistName = track.artists[0]?.name ?? '';
  const result = await searchLrclib(track.title, artistName, track.album.title, track.length);

  if (result?.syncedLyrics || result?.plainLyrics || result?.instrumental) {
    await prisma.lyrics.upsert({
      where: { trackId },
      update: {
        plainLyrics: result.plainLyrics,
        syncedLyrics: result.syncedLyrics,
        instrumental: result.instrumental,
        source: 'lrclib',
        fetchedAt: new Date()
      },
      create: {
        trackId,
        plainLyrics: result.plainLyrics,
        syncedLyrics: result.syncedLyrics,
        instrumental: result.instrumental,
        source: 'lrclib'
      }
    });
    return {
      plainLyrics: result.plainLyrics,
      syncedLyrics: result.syncedLyrics,
      instrumental: result.instrumental,
      found: true
    };
  }

  return { plainLyrics: null, syncedLyrics: null, instrumental: false, found: false };
}

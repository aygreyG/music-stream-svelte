import prisma from '$lib/server/prisma.js';
import type { RankedAlbum, RankedArtist, RankedTrack } from '$lib/shared/types';

const rankingLimit = 10;
const trackRankingLimit = 50;

export type AnalyticsRange = { year: number; month?: number };

type DayStats = { date: string; plays: number; listeningTime: number };

function getRange({ year, month }: AnalyticsRange) {
  if (month) {
    return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) };
  }
  return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addPlay<T extends { plays: number; listeningTime: number }>(
  map: Map<string, T>,
  id: string,
  duration: number,
  create: () => Omit<T, 'plays' | 'listeningTime'>
) {
  const current = map.get(id) ?? ({ ...create(), plays: 0, listeningTime: 0 } as T);
  current.plays += 1;
  current.listeningTime += duration;
  map.set(id, current);
}

function sortRanked<T extends { plays: number; listeningTime: number; name: string }>(
  items: Iterable<T>,
  limit = rankingLimit
) {
  return [...items]
    .toSorted(
      (a, b) =>
        b.plays - a.plays || b.listeningTime - a.listeningTime || a.name.localeCompare(b.name)
    )
    .slice(0, limit);
}

export async function getListeningSummary(userId: string, range: AnalyticsRange) {
  const { start, end } = getRange(range);
  const result = await prisma.listeningEvent.aggregate({
    where: { startedAt: { gte: start, lt: end }, session: { userId } },
    _count: true,
    _sum: { listenedDuration: true }
  });
  return { plays: result._count, listeningTime: result._sum.listenedDuration ?? 0 };
}

export async function getListeningAnalytics(userId: string, range: AnalyticsRange) {
  const { start, end } = getRange(range);
  // aggregated in memory; switch to SQL rollups if this gets slow
  const events = await prisma.listeningEvent.findMany({
    where: {
      startedAt: { gte: start, lt: end },
      session: { userId }
    },
    select: {
      startedAt: true,
      listenedDuration: true,
      track: {
        select: {
          id: true,
          title: true,
          artists: { select: { id: true, name: true } },
          album: {
            select: {
              id: true,
              title: true,
              albumArtId: true,
              albumArtist: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  });

  const tracks = new Map<string, RankedTrack>();
  const artists = new Map<string, RankedArtist>();
  const albums = new Map<string, RankedAlbum>();
  const days = new Map<string, DayStats>();
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    plays: 0,
    listeningTime: 0
  }));

  let listeningTime = 0;

  for (const event of events) {
    const duration = event.listenedDuration;
    const { track } = event;
    listeningTime += duration;

    addPlay(tracks, track.id, duration, () => ({
      id: track.id,
      name: track.title,
      artist: track.artists.map((artist) => artist.name).join(', '),
      artistId: track.artists[0]?.id ?? null,
      album: track.album.title,
      albumId: track.album.id,
      albumArtId: track.album.albumArtId
    }));

    for (const artist of track.artists) {
      addPlay(artists, artist.id, duration, () => ({
        id: artist.id,
        name: artist.name
      }));
    }

    addPlay(albums, track.album.id, duration, () => ({
      id: track.album.id,
      name: track.album.title,
      artist: track.album.albumArtist.name,
      artistId: track.album.albumArtist.id,
      albumArtId: track.album.albumArtId
    }));

    const key = dateKey(event.startedAt);
    addPlay(days, key, duration, () => ({ date: key }));

    const monthStats = monthly[event.startedAt.getMonth()];
    if (monthStats) {
      monthStats.plays += 1;
      monthStats.listeningTime += duration;
    }
  }

  const heatmap: DayStats[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const date = dateKey(cursor);
    heatmap.push(days.get(date) ?? { date, plays: 0, listeningTime: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    summary: {
      listeningTime,
      plays: events.length,
      uniqueTracks: tracks.size,
      uniqueArtists: artists.size,
      uniqueAlbums: albums.size
    },
    topTracks: sortRanked(tracks.values(), trackRankingLimit),
    topArtists: sortRanked(artists.values()),
    topAlbums: sortRanked(albums.values()),
    heatmap,
    monthlyBreakdown: monthly
  };
}

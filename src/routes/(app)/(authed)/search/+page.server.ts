import prisma from '$lib/server/prisma.js';
import type { Prisma } from '@prisma/client';

type TrackType = Prisma.TrackGetPayload<{
  include: {
    album: { include: { albumArtist: true; tracks: { include: { artists: true } } } };
    artists: true;
  };
}>;

type AlbumType = Prisma.AlbumGetPayload<{
  include: { albumArtist: true };
}>;

type ArtistType = Prisma.ArtistGetPayload<{
  include: { _count: { select: { albums: true; tracks: true } } };
}>;

export const load = async ({ url }) => {
  const query = url.searchParams
    .get('query')
    ?.toString()
    .replaceAll('_', '\\_')
    .replaceAll('%', '\\%')
    .trim();
  const type = url.searchParams.get('type')?.toString();

  if (!query) {
    return { title: 'Search' };
  }

  let tracks: TrackType[] = [];
  let artists: ArtistType[] = [];
  let albums: AlbumType[] = [];
  let totalTracks = 0;
  let totalArtists = 0;
  let totalAlbums = 0;

  switch (type) {
    case 'track':
      tracks = await prisma.track.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        include: {
          album: {
            include: {
              albumArtist: true,
              tracks: { include: { artists: true }, orderBy: { trackNumber: 'asc' } }
            }
          },
          artists: true
        }
      });
      totalTracks = tracks.length;
      break;
    case 'artist':
      artists = await prisma.artist.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        include: { _count: { select: { albums: true, tracks: true } } }
      });
      totalArtists = artists.length;
      break;
    case 'album':
      albums = await prisma.album.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        include: { albumArtist: true }
      });
      totalAlbums = albums.length;
      break;
    case 'all':
    default:
      tracks = await prisma.track.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: 10,
        include: {
          album: {
            include: {
              albumArtist: true,
              tracks: { include: { artists: true }, orderBy: { trackNumber: 'asc' } }
            }
          },
          artists: true
        }
      });

      totalTracks = await prisma.track.count({
        where: { title: { contains: query, mode: 'insensitive' } }
      });

      artists = await prisma.artist.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 10,
        include: { _count: { select: { albums: true, tracks: true } } }
      });

      totalArtists = await prisma.artist.count({
        where: { name: { contains: query, mode: 'insensitive' } }
      });

      albums = await prisma.album.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        include: { albumArtist: true },
        take: 10
      });

      totalAlbums = await prisma.album.count({
        where: { title: { contains: query, mode: 'insensitive' } }
      });

      break;
  }

  if (tracks.length === 0 && artists.length === 0 && albums.length === 0) {
    return {
      title: 'Search',
      query,
      type,
      success: false
    };
  }

  return {
    title: 'Search',
    success: true,
    query,
    type,
    results: {
      tracks,
      albums,
      artists
    },
    total: {
      tracks: totalTracks,
      albums: totalAlbums,
      artists: totalArtists
    }
  };
};

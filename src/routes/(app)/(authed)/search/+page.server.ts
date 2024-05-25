import prisma from '$lib/server/prisma.js';
import type { Prisma } from '@prisma/client';

const MAX_ALL_RESULTS = 8;
const MAX_TYPE_RESULTS = 50;

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
        take: MAX_TYPE_RESULTS,
        include: {
          album: {
            include: {
              albumArtist: true,
              tracks: { include: { artists: true }, orderBy: { trackNumber: 'asc' } }
            }
          },
          artists: true
        },
        orderBy: [{ albumId: 'asc' }, { trackNumber: 'asc' }]
      });

      totalTracks = await prisma.track.count({
        where: { title: { contains: query, mode: 'insensitive' } }
      });

      break;
    case 'artist':
      artists = await prisma.artist.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: MAX_TYPE_RESULTS,
        include: { _count: { select: { albums: true, tracks: true } } },
        orderBy: { name: 'asc' }
      });

      totalArtists = await prisma.artist.count({
        where: { name: { contains: query, mode: 'insensitive' } }
      });

      break;
    case 'album':
      albums = await prisma.album.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: MAX_TYPE_RESULTS,
        include: { albumArtist: true },
        orderBy: { title: 'asc' }
      });

      totalAlbums = await prisma.album.count({
        where: { title: { contains: query, mode: 'insensitive' } }
      });

      break;
    case 'all':
    default:
      tracks = await prisma.track.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: MAX_ALL_RESULTS,
        include: {
          album: {
            include: {
              albumArtist: true,
              tracks: { include: { artists: true }, orderBy: { trackNumber: 'asc' } }
            }
          },
          artists: true
        },
        orderBy: [{ albumId: 'asc' }, { trackNumber: 'asc' }]
      });

      totalTracks = await prisma.track.count({
        where: { title: { contains: query, mode: 'insensitive' } }
      });

      artists = await prisma.artist.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: MAX_ALL_RESULTS,
        include: { _count: { select: { albums: true, tracks: true } } },
        orderBy: { name: 'asc' }
      });

      totalArtists = await prisma.artist.count({
        where: { name: { contains: query, mode: 'insensitive' } }
      });

      albums = await prisma.album.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: MAX_ALL_RESULTS,
        include: { albumArtist: true },
        orderBy: { title: 'asc' }
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

export const actions = {
  getTracks: async ({ request }) => {
    const formData = await request.formData();
    const query = formData
      .get('query')
      ?.toString()
      .replaceAll('_', '\\_')
      .replaceAll('%', '\\%')
      .trim();
    const from = parseInt(formData.get('from')?.toString() || '0', 10);

    const tracks = await prisma.track.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      skip: from,
      take: MAX_TYPE_RESULTS,
      include: {
        album: {
          include: {
            albumArtist: true,
            tracks: { include: { artists: true }, orderBy: { trackNumber: 'asc' } }
          }
        },
        artists: true
      },
      orderBy: [{ albumId: 'asc' }, { trackNumber: 'asc' }]
    });

    return { tracks };
  },
  getAlbums: async ({ request }) => {
    const formData = await request.formData();
    const query = formData
      .get('query')
      ?.toString()
      .replaceAll('_', '\\_')
      .replaceAll('%', '\\%')
      .trim();
    const from = parseInt(formData.get('from')?.toString() || '0', 10);

    const albums = await prisma.album.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      skip: from,
      take: MAX_TYPE_RESULTS,
      include: { albumArtist: true },
      orderBy: { title: 'asc' }
    });

    return { albums };
  },
  getArtists: async ({ request }) => {
    const formData = await request.formData();
    const query = formData
      .get('query')
      ?.toString()
      .replaceAll('_', '\\_')
      .replaceAll('%', '\\%')
      .trim();
    const from = parseInt(formData.get('from')?.toString() || '0', 10);

    const artists = await prisma.artist.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      skip: from,
      take: MAX_TYPE_RESULTS,
      include: { _count: { select: { albums: true, tracks: true } } },
      orderBy: { name: 'asc' }
    });

    return { artists };
  }
};

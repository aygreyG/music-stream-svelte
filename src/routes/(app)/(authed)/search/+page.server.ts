import prisma from '$lib/server/prisma.js';
import type { SearchAlbum, SearchArtist, SearchTrack } from '$lib/shared/types.js';
import type { Prisma } from '@prisma/client';

const MAX_ALL_RESULTS = 8;
const MAX_TYPE_RESULTS = 50;

function getTrackArgs(
  query: string,
  skip: number = 0,
  take: number = MAX_TYPE_RESULTS
): Prisma.TrackFindManyArgs {
  return {
    where: { title: { contains: query } },
    skip,
    take,
    include: {
      album: {
        include: {
          albumArtist: true,
          tracks: {
            include: { artists: true },
            orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }]
          }
        }
      },
      artists: true
    },
    orderBy: [{ albumId: 'asc' }, { discNumber: 'asc' }, { trackNumber: 'asc' }]
  };
}

function getAlbumArgs(
  query: string,
  skip: number = 0,
  take: number = MAX_TYPE_RESULTS
): Prisma.AlbumFindManyArgs {
  return {
    where: { title: { contains: query } },
    skip,
    take,
    include: { albumArtist: true },
    orderBy: [{ title: 'asc' }, { releaseDate: 'asc' }]
  };
}

function getArtistArgs(
  query: string,
  skip: number = 0,
  take: number = MAX_TYPE_RESULTS
): Prisma.ArtistFindManyArgs {
  return {
    where: { name: { contains: query } },
    skip,
    take,
    include: { _count: { select: { albums: true, tracks: true } } },
    orderBy: { name: 'asc' }
  };
}

function sanitizeQuery(query?: string) {
  if (!query) {
    return null;
  }

  return query.replaceAll('_', '\\_').replaceAll('%', '\\%').trim();
}

export const load = async ({ url }) => {
  const query = sanitizeQuery(url.searchParams.get('query')?.toString());
  const type = url.searchParams.get('type')?.toString();

  if (!query) {
    return { title: 'Search' };
  }

  let tracks: SearchTrack[] = [];
  let artists: SearchArtist[] = [];
  let albums: SearchAlbum[] = [];
  let totalTracks = 0;
  let totalArtists = 0;
  let totalAlbums = 0;

  switch (type) {
    case 'track':
      tracks = (await prisma.track.findMany(getTrackArgs(query))) as SearchTrack[];

      totalTracks = await prisma.track.count({
        where: { title: { contains: query } }
      });

      break;
    case 'artist':
      artists = (await prisma.artist.findMany(getArtistArgs(query))) as SearchArtist[];

      totalArtists = await prisma.artist.count({
        where: { name: { contains: query } }
      });

      break;
    case 'album':
      albums = (await prisma.album.findMany(getAlbumArgs(query))) as SearchAlbum[];

      totalAlbums = await prisma.album.count({
        where: { title: { contains: query } }
      });

      break;
    case 'all':
    default:
      tracks = (await prisma.track.findMany(
        getTrackArgs(query, 0, MAX_ALL_RESULTS)
      )) as SearchTrack[];

      totalTracks = await prisma.track.count({
        where: { title: { contains: query } }
      });

      artists = (await prisma.artist.findMany(
        getArtistArgs(query, 0, MAX_ALL_RESULTS)
      )) as SearchArtist[];

      totalArtists = await prisma.artist.count({
        where: { name: { contains: query } }
      });

      albums = (await prisma.album.findMany(
        getAlbumArgs(query, 0, MAX_ALL_RESULTS)
      )) as SearchAlbum[];

      totalAlbums = await prisma.album.count({
        where: { title: { contains: query } }
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
    const query = sanitizeQuery(formData.get('query')?.toString());
    const from = parseInt(formData.get('from')?.toString() || '0', 10);

    if (!query) {
      return { tracks: [] };
    }

    const tracks = await prisma.track.findMany(getTrackArgs(query, from));

    return { tracks };
  },
  getAlbums: async ({ request }) => {
    const formData = await request.formData();
    const query = sanitizeQuery(formData.get('query')?.toString());
    const from = parseInt(formData.get('from')?.toString() || '0', 10);

    if (!query) {
      return { albums: [] };
    }

    const albums = await prisma.album.findMany(getAlbumArgs(query, from));

    return { albums };
  },
  getArtists: async ({ request }) => {
    const formData = await request.formData();
    const query = sanitizeQuery(formData.get('query')?.toString());
    const from = parseInt(formData.get('from')?.toString() || '0', 10);

    if (!query) {
      return { artists: [] };
    }

    const artists = await prisma.artist.findMany(getArtistArgs(query, from));

    return { artists };
  }
};

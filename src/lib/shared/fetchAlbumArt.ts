import type { AlbumReleaseSearchResult } from './types';

const API_URL = 'https://musicbrainz.org/ws/2/';
const COVER_ART_URL = 'https://coverartarchive.org/release/';

export async function searchForAlbumRelease(
  artist: string,
  album: string,
  offset: number = 0,
  limit: number = 10
) {
  const response = await fetch(
    `${API_URL}release?query=${album} AND artist:${artist}&fmt=json&limit=${limit}&offset=${offset}`
  );
  const data = await response.json();
  return data as AlbumReleaseSearchResult;
}

export function getAlbumArtUrl(releaseId: string) {
  return `${COVER_ART_URL}${releaseId}/front`;
}

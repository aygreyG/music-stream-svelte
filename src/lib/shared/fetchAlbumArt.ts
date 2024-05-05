import type { AlbumReleaseSearchResult } from './types';

const API_URL = 'https://musicbrainz.org/ws/2/';
const COVER_ART_URL = 'https://coverartarchive.org/release/';
const APP_NAME = 'SvelteMusicStreamer';

export async function searchForAlbumRelease(
  query: string,
  ownerEmail: string,
  offset: number = 0,
  limit: number = 10
) {
  const response = await fetch(
    `${API_URL}release?query=${query.replaceAll('&', 'and')}&fmt=json&limit=${limit}&offset=${offset}`,
    {
      headers: {
        'User-Agent': `${APP_NAME} ( ${ownerEmail} )`
      }
    }
  );
  const data = await response.json();
  return data as AlbumReleaseSearchResult;
}

export function getAlbumArtUrl(releaseId: string) {
  return `${COVER_ART_URL}${releaseId}/front`;
}

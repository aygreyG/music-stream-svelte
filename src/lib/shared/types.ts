import type { Album, Artist, Prisma } from '../../generated/prisma-client/client';

export type SignedInUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    role: true;
    email: true;
    createdAt: true;
    updatedAt: true;
    playlists: {
      include: { tracks: true };
    };
  };
}>;

export type PlaylistWithTracks = Prisma.PlaylistGetPayload<{
  include: { tracks: { include: { album: true } } };
}>;

export type FolderNode = {
  label: string;
  children: FolderNode[];
  path: string;
  parent?: FolderNode;
};

export type SearchTrack = Prisma.TrackGetPayload<{
  include: {
    album: {
      include: {
        albumArtist: true;
        tracks: { include: { artists: true }; orderBy: { trackNumber: 'asc' } };
      };
    };
    artists: true;
  };
}>;

export type SearchAlbum = Prisma.AlbumGetPayload<{
  include: { albumArtist: true };
}>;

export type SearchArtist = Prisma.ArtistGetPayload<{
  include: { _count: { select: { albums: true; tracks: true } } };
}>;

export type ImageSize = 's' | 'm' | 'l';

export function isValidImageSize(size: string): size is ImageSize {
  return ['s', 'm', 'l'].includes(size);
}

export type AlbumWithArt = Album & { albumArt: string };
export type AlbumWithArtist = Album & { albumArtist: Artist };

type Alias = {
  'sort-name': string;
  name: string;
  locale: null | string;
  type: null | string;
  primary: null | boolean;
  'begin-date': null | string;
  'end-date': null | string;
};

type ResponseArtist = {
  id: string;
  name: string;
  'sort-name': string;
  aliases: Alias[];
};

type ArtistCredit = {
  artist: ResponseArtist;
};

type TextRepresentation = {
  language: string;
  script: string;
};

type ReleaseGroup = {
  id: string;
  'primary-type': string;
};

type Area = {
  id: string;
  name: string;
  'sort-name': string;
  'iso-3166-1-codes': string[];
};

type ReleaseEvent = {
  date: string;
  area: Area;
};

type Label = {
  id: string;
  name: string;
};

type LabelInfo = {
  'catalog-number': string;
  label: Label;
};

type Media = {
  format: string;
  'disc-count': number;
  'track-count': number;
};

export type Release = {
  id: string;
  score: string;
  count: number;
  title: string;
  'status-id': string;
  status: string;
  packaging: string;
  'text-representation': TextRepresentation;
  'artist-credit': ArtistCredit[];
  'release-group': ReleaseGroup;
  date: string;
  country: string;
  'release-events': ReleaseEvent[];
  barcode: string;
  'label-info': LabelInfo[];
  'track-count': number;
  media: Media[];
};

export type AlbumReleaseSearchResult = {
  created: string;
  count: number;
  offset: number;
  releases: Release[];
};

export interface MaterialScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceDim: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  background: string;
  onBackground: string;
  error: string;
  onError: string;
}

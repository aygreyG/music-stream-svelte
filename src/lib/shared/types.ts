import type { Album, User } from '@prisma/client';

export type SignedInUser = Omit<User, 'password'>;

export type FolderNode = {
  label: string;
  children: FolderNode[];
  path: string;
  parent?: FolderNode;
};

export type ImageSize = 's' | 'm' | 'l';

export function isValidImageSize(size: string): size is ImageSize {
  return ['s', 'm', 'l'].includes(size);
}

export type AlbumWithArt = Album & { albumArt: string };

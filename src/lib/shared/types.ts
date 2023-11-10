import type { User } from '@prisma/client';

export type SignedInUser = Omit<User, 'password'>;

export type FolderNode = {
	label: string;
	children: FolderNode[];
	path: string;
	parent?: FolderNode;
};

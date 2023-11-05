export type FolderNode = {
	label: string;
	children: FolderNode[];
	path: string;
	parent?: FolderNode;
};

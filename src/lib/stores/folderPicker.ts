import type { FolderNode } from '$lib/shared/types';
import { writable } from 'svelte/store';

const pickedFolder = writable<FolderNode | null>(null);

export default pickedFolder;

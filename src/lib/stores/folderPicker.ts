import { writable } from 'svelte/store';

import type { FolderNode } from '$lib/shared/types';

const pickedFolder = writable<FolderNode | null>(null);

export default pickedFolder;

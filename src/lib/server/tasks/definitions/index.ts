import type { TaskDefinition } from '$lib/shared/types';

import fullLibrarySync from './fullLibrarySync';
import librarySync from './librarySync';
import regenerateAlbumImage from './regenerateAlbumImage';
import regenerateTags from './regenerateTags';

const definitions: TaskDefinition[] = [
  librarySync,
  fullLibrarySync,
  regenerateAlbumImage,
  regenerateTags
];

export default definitions;

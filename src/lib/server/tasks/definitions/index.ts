import type { TaskDefinition } from '$lib/shared/types';
import librarySync from './librarySync';
import fullLibrarySync from './fullLibrarySync';
import regenerateAlbumImage from './regenerateAlbumImage';
import regenerateTags from './regenerateTags';

const definitions: TaskDefinition[] = [
  librarySync,
  fullLibrarySync,
  regenerateAlbumImage,
  regenerateTags
];

export default definitions;

import type { TaskDefinition } from '$lib/shared/types';

import fetchAllLyrics from './fetchAllLyrics';
import fetchMissingLyrics from './fetchMissingLyrics';
import fullLibrarySync from './fullLibrarySync';
import librarySync from './librarySync';
import regenerateAlbumImage from './regenerateAlbumImage';
import regenerateTags from './regenerateTags';

const definitions: TaskDefinition[] = [
  librarySync,
  fullLibrarySync,
  regenerateAlbumImage,
  regenerateTags,
  fetchAllLyrics,
  fetchMissingLyrics
];

export default definitions;

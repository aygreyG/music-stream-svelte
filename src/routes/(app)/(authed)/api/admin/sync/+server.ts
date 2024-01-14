import {
  getLibrarySyncInProgress,
  runLibrarySync,
  runFullLibrarySync
} from '$lib/server/librarySync';
import { error, json } from '@sveltejs/kit';

export const POST = async ({ url }) => {
  if (getLibrarySyncInProgress()) {
    error(400, { message: 'Library sync already in progress' });
  }

  const reset = url.searchParams.get('reset');

  if (reset === 'true') {
    runFullLibrarySync();
  } else {
    runLibrarySync();
  }

  return json({ message: 'Library sync started' });
};

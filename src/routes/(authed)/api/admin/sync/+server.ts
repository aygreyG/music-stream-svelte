import { getLibrarySyncInProgress, runLibrarySync } from '$lib/server/librarySync';
import { error, json } from '@sveltejs/kit';

export const POST = async () => {
	if (getLibrarySyncInProgress()) {
		throw error(400, { message: 'Library sync already in progress' });
	}

	runLibrarySync();

	return json({ message: 'Library sync started' });
};

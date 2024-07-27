import { getServerSettings } from '$lib/server/serverSettings.js';
import { getSubFolders } from '$lib/server/utils.js';
import { error, json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
  const settings = await getServerSettings();

  if (settings) {
    error(400, { message: 'Server settings already exist' });
  }

  const data = await request.json();

  if (!data.path) {
    error(400, { message: 'path is required' });
  }

  const subFolders = await getSubFolders(data.path);

  return json(subFolders);
};

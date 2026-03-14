import { isRegenerationInProgress, startRegeneration } from '$lib/server/tags.js';
import { ROLE } from '$lib/shared/consts.js';
import { error, json } from '@sveltejs/kit';

export const GET = async ({ locals }) => {
  if (locals.user?.role !== ROLE.ADMIN && locals.user?.role !== ROLE.OWNER) {
    error(403, { message: 'Forbidden' });
  }

  if (isRegenerationInProgress()) {
    error(400, { message: 'Tag regeneration already in progress' });
  }

  startRegeneration();

  return json({ message: 'Tag regeneration started' });
};

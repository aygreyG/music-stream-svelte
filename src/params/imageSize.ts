import type { ParamMatcher } from '@sveltejs/kit';

import { isValidImageSize } from '$lib/shared/types';

export const match: ParamMatcher = (param) => {
  return isValidImageSize(param);
};

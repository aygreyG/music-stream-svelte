import { isValidImageSize } from '$lib/shared/types';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  return isValidImageSize(param);
};

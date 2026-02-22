import { handleVibrate } from '$lib/utils';
import type { Action } from 'svelte/action';

type VibrationOptions = {
  pattern?: number | number[];
  mute?: boolean;
};

export const vibrate: Action<HTMLElement, VibrationOptions | undefined> = (node, params) => {
  let finalParams = { pattern: 1, mute: false, ...params };

  const handleVibration = () => handleVibrate(finalParams.pattern, finalParams.mute);

  node.addEventListener('click', handleVibration);

  return {
    update(newParams: VibrationOptions | undefined) {
      finalParams = { ...finalParams, ...newParams };
    },
    destroy() {
      node.removeEventListener('click', handleVibration);
    }
  };
};

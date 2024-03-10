import type { Action } from 'svelte/action';

type VibrationOptions = {
  pattern?: number | number[];
  mute?: boolean;
};

export const vibrate: Action<HTMLElement, VibrationOptions | undefined> = (node, params) => {
  let finalParams = { pattern: 1, mute: false, ...params };

  const handleVibration = () => {
    if (
      navigator &&
      !finalParams.mute &&
      matchMedia('(prefers-reduced-motion: no-preference)').matches &&
      matchMedia('(hover: none), (pointer: coarse)').matches
    ) {
      navigator.vibrate(finalParams.pattern);
    }
  };

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

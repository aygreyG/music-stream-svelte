// TODO: This might be used for cross page transitions, should be explored
import { crossfade as sCrossfade } from 'svelte/transition';
import { cubicInOut } from 'svelte/easing';

export const crossfade = sCrossfade({
  easing: cubicInOut,
  duration: 500,
  fallback(node) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;

    return {
      duration: 0,
      css: (t) => `
            transform: ${transform};
            opacity: ${t};
        `
    };
  }
});

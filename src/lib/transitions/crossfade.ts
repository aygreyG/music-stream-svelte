// This is used for cross page transitions
import { cubicInOut } from 'svelte/easing';
import { crossfade as sCrossfade } from 'svelte/transition';

export const crossfade = sCrossfade({
  easing: cubicInOut,
  duration: 500,
  fallback(node) {
    const style = getComputedStyle(node);
    const transform = style.transform;

    return {
      duration: 250,
      css: (t) => `
            transform: ${transform};
            opacity: ${t};
        `
    };
  }
});

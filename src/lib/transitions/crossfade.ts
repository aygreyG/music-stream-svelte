// This is used for cross page transitions
import { crossfade as sCrossfade } from 'svelte/transition';
import { cubicInOut } from 'svelte/easing';

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

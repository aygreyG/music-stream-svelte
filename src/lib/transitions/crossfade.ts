// TODO: This might be used for cross page transitions, should be explored
import { crossfade as sCrossfade } from 'svelte/transition';
import { cubicIn } from 'svelte/easing';

export const crossfade = sCrossfade({
  easing: cubicIn,
  duration: 500,
  fallback(node) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;

    return {
      duration: 500,
      css: (t) => `
            transform: ${transform};
            opacity: ${t};
        `
    };
  }
});

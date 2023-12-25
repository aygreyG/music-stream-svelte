// TODO: This might be used for cross page transitions, should be explored
import { crossfade as sCrossfade } from 'svelte/transition';
import { cubicIn } from 'svelte/easing';

export const crossfade = sCrossfade({ easing: cubicIn, duration: 500 });

import { crossfade as sCrossfade } from 'svelte/transition';
import { cubicIn } from 'svelte/easing';

export const crossfade = sCrossfade({ easing: cubicIn, duration: 500 });

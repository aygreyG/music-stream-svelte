import { defaultTheme } from '$lib/shared/theme';
import type { Theme } from '@prisma/client';
import { writable } from 'svelte/store';

const currentTheme = writable<Theme>(defaultTheme);

export default currentTheme;

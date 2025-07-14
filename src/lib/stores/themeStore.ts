import { defaultTheme } from '$lib/shared/theme';
import type { Theme } from '../../generated/prisma-client/client';
import { writable } from 'svelte/store';

const currentTheme = writable<Theme>(defaultTheme);

export default currentTheme;

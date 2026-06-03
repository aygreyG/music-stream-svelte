import { MediaQuery } from 'svelte/reactivity';

export const deviceInfo = $state<{ isMobile: { current: boolean } }>({
  isMobile: { current: false }
});

export function initDeviceInfo() {
  deviceInfo.isMobile = new MediaQuery('(hover: none), (pointer: coarse)', false);
}

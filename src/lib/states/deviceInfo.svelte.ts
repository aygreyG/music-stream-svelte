export const deviceInfo = $state({ isMobile: false });

export function initDeviceInfo() {
  const mq = matchMedia('(hover: none), (pointer: coarse)');
  deviceInfo.isMobile = mq.matches;
  mq.addEventListener('change', (e) => {
    deviceInfo.isMobile = e.matches;
  });
}

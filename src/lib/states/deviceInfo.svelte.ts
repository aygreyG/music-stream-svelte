export const deviceInfo = $state({ isMobile: false });

export function initDeviceInfo() {
  const mq = matchMedia('(hover: none), (pointer: coarse)');
  deviceInfo.isMobile = mq.matches;

  const handleChange = (e: MediaQueryListEvent) => {
    deviceInfo.isMobile = e.matches;
  };

  mq.addEventListener('change', handleChange);

  return () => {
    mq.removeEventListener('change', handleChange);
  };
}

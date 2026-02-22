/** Transform seconds into a human readable format
 * @param seconds - The number of seconds to transform
 * @param maxIntervals - The maximum number of intervals to display, it can be max 7 (default is 2)
 */
export function getReadableTime(seconds: number, maxIntervals = 2) {
  if (seconds < 1) return 'less than a second';

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  let counter = seconds;
  let result = '';
  let remaining = maxIntervals;

  for (const [key, value] of Object.entries(intervals)) {
    const interval = Math.floor(counter / value);

    if (interval > 0) {
      remaining--;
      result += `${interval} ${key}${interval > 1 ? 's' : ''} `;
      counter -= interval * value;
      if (remaining === 0) break;
    }
  }

  return result;
}

export function preventDefault(fn?: (event: Event) => void) {
  return function (event: Event) {
    event.preventDefault();
    fn?.(event);
  };
}

export function stopPropagation(fn?: (event: Event) => void) {
  return function (event: Event) {
    event.stopPropagation();
    fn?.(event);
  };
}

export function handleVibrate(pattern: number | number[] = 200, mute = false) {
  if (
    !mute &&
    navigator &&
    matchMedia('(prefers-reduced-motion: no-preference)').matches &&
    matchMedia('(hover: none), (pointer: coarse)').matches &&
    'vibrate' in navigator
  ) {
    navigator.vibrate(pattern);
  }
}

export function getDarkModePreference() {
  const localStorageDarkMode = localStorage.getItem('darkMode');
  return localStorageDarkMode
    ? localStorageDarkMode === 'true'
    : !matchMedia('(prefers-color-scheme: light)').matches;
}

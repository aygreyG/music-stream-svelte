export const getCSSVariables = (value?: string | null) => {
  if (value) {
    return `--primary: ${value}; --accessible: ${getAccessibleColor(value)};`;
  }

  return '';
};

export const getCSSVariable = (name: string, value?: string | null) => {
  if (value) {
    return `--${name}: ${value};`;
  }

  return '';
};

/** Change hex color into RGB */
export const getRGBColor = (hex: string, type: string) => {
  const color = hex.replace(/#/g, '');
  // rgb values
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);

  return `--color-${type}: ${r}, ${g}, ${b};`;
};

/** Determine the accessible color of text */
export const getAccessibleColor = (hex?: string | null) => {
  if (!hex) return '';

  const color = hex.replace(/#/g, '');
  // rgb values
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? '#18181b' : '#d4d4d8';
};

/** Determine if the given objects are equal.
 *
 *  Objects must be JSON serializable
 */
export function isObjectEqual<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

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

export function getHexColorFromRGB(r: number, g: number, b: number) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).split('.')[0]}`;
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

import { browser } from '$app/environment';
import { FALLBACK_SCHEME, SCHEME_KEYS, type SCHEME_TYPES } from './shared/consts';
import type { MaterialScheme } from './shared/types';
import { getDarkModePreference } from './utils';

let mcuModule: typeof import('@material/material-color-utilities') | null = null;
let mcuPromise: Promise<typeof import('@material/material-color-utilities')> | null = null;

const schemeCache = new Map<string, MaterialScheme>();
const pendingSchemes = new Map<string, Promise<MaterialScheme>>();

let defaultScheme: MaterialScheme | null = null;

async function loadMCU() {
  if (mcuModule) return mcuModule;
  if (mcuPromise) return mcuPromise;
  mcuPromise = import('@material/material-color-utilities');
  mcuModule = await mcuPromise;
  return mcuModule;
}

function buildScheme(
  mcu: typeof import('@material/material-color-utilities'),
  sourceArgb: number
): MaterialScheme {
  const hct = mcu.Hct.fromInt(sourceArgb);
  const isDark = getDarkModePreference();
  const schemeType = localStorage.getItem('schemeType') as
    | (typeof SCHEME_TYPES)[number]
    | 'EXPRESSIVE';

  let selectedSchemeType = mcu.SchemeExpressive;

  switch (schemeType) {
    case 'CONTENT':
      selectedSchemeType = mcu.SchemeContent;
      break;
    case 'EXPRESSIVE':
      selectedSchemeType = mcu.SchemeExpressive;
      break;
    case 'FIDELITY':
      selectedSchemeType = mcu.SchemeFidelity;
      break;
    case 'MONOCHROME':
      selectedSchemeType = mcu.SchemeMonochrome;
      break;
    case 'NEUTRAL':
      selectedSchemeType = mcu.SchemeNeutral;
      break;
    case 'TONAL_SPOT':
      selectedSchemeType = mcu.SchemeTonalSpot;
      break;
    case 'VIBRANT':
      selectedSchemeType = mcu.SchemeVibrant;
      break;
  }

  const scheme = new selectedSchemeType(hct, isDark, 0, '2025', 'phone');

  const result = {} as Record<string, string>;
  for (const key of SCHEME_KEYS) {
    result[key] = mcu.hexFromArgb(scheme[key]);
  }
  return result as unknown as MaterialScheme;
}

/**
 * Returns a pre-computed default scheme for use when no album art is available.
 * Uses a neutral zinc color as source.
 */
export async function getDefaultScheme(): Promise<MaterialScheme> {
  if (defaultScheme) return defaultScheme;
  if (!browser) return FALLBACK_SCHEME;

  const mcu = await loadMCU();
  defaultScheme = buildScheme(mcu, mcu.argbFromHex('#6750A4'));
  return defaultScheme;
}

/**
 * Get an M3 Expressive color scheme for an album. Uses image-based source color extraction.
 * Results are cached by albumId/albumArtId.
 * Only works in the browser — returns fallback scheme on server.
 */
export async function getExpressiveScheme(
  albumId: string,
  albumArtId: string | null
): Promise<MaterialScheme> {
  if (!browser) return FALLBACK_SCHEME;

  if (!albumArtId) return getDefaultScheme();

  const cacheKey = `${albumId}/${albumArtId}`;

  const cached = schemeCache.get(cacheKey);
  if (cached) return cached;

  const pending = pendingSchemes.get(cacheKey);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const mcu = await loadMCU();
      const image = new Image();
      image.src = `/api/image/${albumId}/${albumArtId}/s`;

      const sourceArgb = await new Promise<number>((resolve, reject) => {
        image.onload = async () => {
          try {
            const argb = await mcu.sourceColorFromImage(image);
            resolve(argb);
          } catch (e) {
            reject(e);
          }
        };
        image.onerror = () => reject(new Error('Failed to load image'));
      });

      const scheme = buildScheme(mcu, sourceArgb);
      schemeCache.set(cacheKey, scheme);
      return scheme;
    } catch {
      const fallback = await getDefaultScheme();
      schemeCache.set(cacheKey, fallback);
      return fallback;
    } finally {
      pendingSchemes.delete(cacheKey);
    }
  })();

  pendingSchemes.set(cacheKey, promise);
  return promise;
}

/**
 * Convert a MaterialScheme to a CSS custom properties string.
 */
export function schemeToCSS(scheme: MaterialScheme): string {
  const parts: string[] = [];
  for (const key of SCHEME_KEYS) {
    const cssKey = key.replaceAll(/([A-Z])/g, '-$1').toLowerCase();
    parts.push(`--${cssKey}: ${scheme[key]}`);
  }
  return parts.join('; ');
}

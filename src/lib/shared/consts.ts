import type { MaterialScheme } from './types';

const ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER'
} as const;

type RoleType = (typeof ROLE)[keyof typeof ROLE];

const ALLOWED_MUSIC_FILE_EXTENSIONS = ['flac', 'wav', 'mp3'];
const EXCLUDE_FILES_STARTING_WITH = ['.', '_'];
const IMAGE_FILE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

const SCHEME_TYPES = [
  'CONTENT',
  'EXPRESSIVE',
  'FIDELITY',
  'MONOCHROME',
  'NEUTRAL',
  'TONAL_SPOT',
  'VIBRANT'
] as const;

const SCHEME_KEYS = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'surfaceDim',
  'surfaceContainerLow',
  'surfaceContainer',
  'outline',
  'outlineVariant',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'background',
  'onBackground',
  'error',
  'onError'
] as const;

const FALLBACK_SCHEME: MaterialScheme = {
  primary: '#d4c3ff',
  onPrimary: '#4a3a72',
  primaryContainer: '#c7b4f5',
  onPrimaryContainer: '#403168',
  secondary: '#bbcbb2',
  onSecondary: '#364431',
  secondaryContainer: '#1c2918',
  onSecondaryContainer: '#98a990',
  tertiary: '#edffdf',
  onTertiary: '#376b21',
  tertiaryContainer: '#bffca0',
  onTertiaryContainer: '#2f6219',
  surface: '#120b1a',
  onSurface: '#f1dfff',
  surfaceVariant: '#2d203c',
  onSurfaceVariant: '#b7a4c7',
  surfaceDim: '#120b1a',
  surfaceContainerLow: '#181021',
  surfaceContainer: '#1f152a',
  outline: '#7f6f90',
  outlineVariant: '#504260',
  inverseSurface: '#fff7ff',
  inverseOnSurface: '#5b5163',
  inversePrimary: '#65568f',
  background: '#120b1a',
  onBackground: '#f1dfff',
  error: '#fd6f85',
  onError: '#490013'
};

export {
  ROLE,
  ALLOWED_MUSIC_FILE_EXTENSIONS,
  EXCLUDE_FILES_STARTING_WITH,
  IMAGE_FILE_EXTENSIONS,
  SCHEME_TYPES,
  SCHEME_KEYS,
  FALLBACK_SCHEME
};

export type { RoleType };

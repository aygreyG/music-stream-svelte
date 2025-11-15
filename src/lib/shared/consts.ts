const ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER'
} as const;

type RoleType = (typeof ROLE)[keyof typeof ROLE];

const GRADIENT_ANGLE = {
  TOBOTTOM: 'to_bottom',
  TOTOP: 'to_top',
  TOLEFT: 'to_left',
  TORIGHT: 'to_right'
} as const;

type GradientAngleType = (typeof GRADIENT_ANGLE)[keyof typeof GRADIENT_ANGLE];

const ALLOWED_MUSIC_FILE_EXTENSIONS = ['flac', 'wav', 'mp3'];
const EXCLUDE_FILES_STARTING_WITH = ['.', '_'];
const IMAGE_FILE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

export {
  ROLE,
  GRADIENT_ANGLE,
  ALLOWED_MUSIC_FILE_EXTENSIONS,
  EXCLUDE_FILES_STARTING_WITH,
  IMAGE_FILE_EXTENSIONS
};

export type { RoleType, GradientAngleType };

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

export { ROLE, GRADIENT_ANGLE };
export type { RoleType, GradientAngleType };

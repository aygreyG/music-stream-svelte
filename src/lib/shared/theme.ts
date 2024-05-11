import type { Theme } from '@prisma/client';

export const defaultTheme: Theme = {
  id: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  primary: '#c026d3',
  rounding: 15,
  gradientStart: '#c026d3',
  gradientMiddle: '#4f46e5',
  gradientAngle: 'to_bottom',
  gradientEnd: '#22d3ee',
  gradientMiddlePoint: 50,
  userId: ''
};

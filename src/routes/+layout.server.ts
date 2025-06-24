import prisma from '$lib/server/prisma.js';
import { ROLE } from '$lib/shared/consts.js';
import { defaultTheme } from '$lib/shared/theme.js';
import type { Theme } from '../generated/prisma-client/client';

export const load = async ({ locals, depends }) => {
  depends('mainLayout');
  let theme: Theme;

  if (locals.user?.themes && locals.user.themes.length > 0) {
    theme = locals.user.themes[0];
  } else {
    const owner = await prisma.user.findFirst({
      where: {
        role: ROLE.OWNER
      },
      select: {
        id: true,
        themes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (owner?.themes && owner.themes.length > 0) {
      theme = owner.themes[0];
    } else if (owner) {
      theme = await prisma.theme.create({
        data: {
          user: {
            connect: {
              id: owner.id
            }
          }
        }
      });
    } else {
      theme = defaultTheme;
    }
  }

  return {
    user: locals.user,
    theme,
    APP_VERSION: process.env.APP_VERSION || 'unknown'
  };
};

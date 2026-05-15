export const load = async ({ locals, depends }) => {
  depends('load:main');

  return {
    user: locals.user,
    APP_VERSION: process.env.APP_VERSION || 'unknown'
  };
};

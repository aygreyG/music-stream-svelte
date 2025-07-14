export const load = async ({ locals, depends }) => {
  depends('mainLayout');

  return {
    user: locals.user,
    APP_VERSION: process.env.APP_VERSION || 'unknown'
  };
};

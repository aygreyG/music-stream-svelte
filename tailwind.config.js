/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      screens: {
        'h-md': {
          raw: '(max-height: 700px)'
        },
        'h-sm': {
          raw: '(max-height: 560px)'
        }
      }
    }
  }
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      boxShadow: {
        'md-top': '0 -4px 6px -1px rgba(0,0,0,0.1), 0 -2px 4px -2px rgba(0,0,0,0.1)'
      },
      screens: {
        'h-md': {
          raw: '(max-height: 700px)'
        },
        'h-sm': {
          raw: '(max-height: 560px)'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};

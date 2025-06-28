function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

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
      },
      textColor: {
        primary: withOpacity('--color-primary'),
        accessible: withOpacity('--color-accessible')
      },
      backgroundColor: {
        primary: withOpacity('--color-primary')
      },
      borderColor: {
        primary: withOpacity('--color-primary')
      },
      ringColor: {
        primary: withOpacity('--color-primary')
      },
      outlineColor: {
        primary: withOpacity('--color-primary')
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};

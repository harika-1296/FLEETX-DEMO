/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Override slate scale with a deep teal-charcoal palette
        slate: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f4f4a',
          800: '#0a3f3b',
          900: '#07302d',
          950: '#04201e',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f1fe',
          100: '#e1e3fd',
          200: '#c3c7fb',
          300: '#9ba1f7',
          400: '#7a7ff2',
          500: '#5b5fec',
          600: '#4a3fe0',
          700: '#3f34c4',
          800: '#342c9e',
          900: '#2c277d',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f7fb',
          border: '#e6e8f0',
        },
        ink: {
          DEFAULT: '#171923',
          soft: '#5b5f73',
          faint: '#9599ab',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(23, 25, 35, 0.04), 0 8px 24px rgba(23, 25, 35, 0.06)',
      },
      borderRadius: {
        bubble: '18px',
      },
    },
  },
  plugins: [],
};

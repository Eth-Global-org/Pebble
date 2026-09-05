/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        defi: {
          dark: '#0B0E14',
          card: '#151A23',
          border: '#232B3B',
          accent: '#6366F1',
          highlight: '#38BDF8'
        }
      }
    },
  },
  plugins: [],
};

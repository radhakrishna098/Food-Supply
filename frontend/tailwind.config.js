/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#1B4D3E', // Main Forest Green
          900: '#0F3327', // Dark Forest
          950: '#061a13',
        },
        cream: {
          50: '#FDFAF5',
          100: '#FAF7F2', // Warm cream background
          200: '#F3ECE2',
          300: '#E8DDCF',
          400: '#D6C5AF',
          500: '#C2AB8F',
        },
        terracotta: {
          50: '#FDF6F2',
          100: '#FBEFEA',
          200: '#F6D9CD',
          300: '#EEB9A4',
          400: '#E48C6B',
          500: '#E06D3B', // Restrained Orange Accent
          600: '#C85A28',
          700: '#A4441C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

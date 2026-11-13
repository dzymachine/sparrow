/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#b88b7d',
          600: '#9d6b5e',
          700: '#7e4d41',
          800: '#5c3228',
          900: '#3d1d16',
        },
        sage: {
          50: '#f4f7f5',
          100: '#e3ebe5',
          500: '#5f8d75',
          600: '#4a725e',
          700: '#375747',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        linen: '#F8F6F2',
        hairline: '#E2DBD0',
        espresso: '#261E19',
        umber: '#5C4E43',
        sage: {
          50: '#F4F7F4',
          100: '#E6ECE6',
          200: '#D1DDD6',
          300: '#ADC2B5',
          400: '#7E9E8A',
          500: '#5A7A66',
          600: '#435C4D', // Botanical sage primary action
          700: '#354A3E',
          800: '#2A3A31',
          900: '#1F2A24',
        },
        warm: {
          50: '#FAF9F6',
          100: '#F4EFEB',
          200: '#EADBCE',
          300: '#DFCABC',
          400: '#CBB2A0',
          500: '#A98F7C',
          600: '#8C725F',
          700: '#6C5646',
          800: '#4F3E33',
          900: '#261E19',
        },
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
        }
      }
    },
  },
  plugins: [],
}

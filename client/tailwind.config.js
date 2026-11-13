/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Newsreader"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        linen: '#FAF7F2',
        oat: '#F4EFEA',
        nest: '#EDE6DD',
        hairline: '#E2DAD0',
        espresso: '#1c1c19',
        umber: '#5F635E',
        forest: {
          DEFAULT: '#4F5E47',
          deep: '#384631',
          hover: '#3E4A38',
          meadow: '#8A9A7B',
          mist: '#d7e8ca',
        },
        feather: {
          DEFAULT: '#A07E5F',
          deep: '#583d23',
          light: '#e7bf9c',
        },
        dawn: {
          DEFAULT: '#D9B3AC',
          tint: '#FAF2F0',
        },
        sage: {
          50: '#F5F7F3',
          100: '#E8EDE3',
          200: '#D7E8CA',
          300: '#BBCCAF',
          400: '#8A9A7B',
          500: '#546347',
          600: '#4F5E47',
          700: '#384631',
          800: '#2C3826',
          900: '#121F0D',
        },
        warm: {
          50: '#FCF9F4',
          100: '#FAF7F2',
          200: '#F4EFEA',
          300: '#EDE6DD',
          400: '#E2DAD0',
          500: '#A07E5F',
          600: '#715438',
          700: '#583d23',
          800: '#444841',
          900: '#1c1c19',
        },
        brand: {
          50: '#FAF7F2',
          100: '#F4EFEA',
          200: '#EDE6DD',
          300: '#E2DAD0',
          400: '#C5C8BE',
          500: '#A07E5F',
          600: '#546347',
          700: '#4F5E47',
          800: '#384631',
          900: '#1c1c19',
        }
      }
    },
  },
  plugins: [],
}

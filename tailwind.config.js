/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        rose: {
          50: '#FBF3F4',
          100: '#F6E4E6',
          200: '#E8B4B8',
          300: '#D99196',
          400: '#C77076',
          500: '#B55359',
          600: '#9A4147'
        },
        lavender: {
          50: '#F6F2F9',
          100: '#E9E0F1',
          200: '#C9B1D4',
          300: '#AD8AC0',
          400: '#9067AB',
          500: '#754994'
        },
        sage: {
          50: '#F2F6F1',
          100: '#E0EBDD',
          200: '#A8C3A0',
          300: '#84A97C',
          400: '#668F5C',
          500: '#4E7745'
        },
        warm: {
          50: '#FAF7F2',
          100: '#F3ECE0',
          200: '#E6D8C0',
          300: '#D3B88F',
          400: '#BF9A5E',
          500: '#A87C3C'
        },
        sunset: {
          50: '#FEF5EC',
          100: '#FCE6CF',
          200: '#F2B880',
          300: '#E89A4E',
          400: '#DB7E20',
          500: '#B8650F'
        },
        clay: {
          50: '#FAF6F4',
          100: '#F0E7E2',
          200: '#E0CCC2',
          300: '#C9ABA0',
          400: '#AC8A7D',
          500: '#8F6D5F',
          600: '#75574B',
          700: '#5C4B42',
          800: '#4A3C35',
          900: '#3B2F29'
        }
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif SC', 'Georgia', 'serif']
      }
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./public/*.html", './public/src/**/*.js', './public/src/**/*.ts'],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#eafd4b',
          light: '#f5ffb0',
        },
      },
    },

  },
  plugins: [],
}


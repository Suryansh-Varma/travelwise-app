/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
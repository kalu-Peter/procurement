/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'header-yellow': '#d9b570',
        'bs-green': '#198754',
      },
    },
  },
  plugins: [],
}


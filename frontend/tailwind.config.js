/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1d2e4a",
        secondary: "#304c7a",
        ternary: "#e6e6e6"
      }
    },
  },
  plugins: [],
}

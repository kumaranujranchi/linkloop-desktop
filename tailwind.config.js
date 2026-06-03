/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          200: "#c4b8ff",
          300: "#a58aff",
          400: "#8b6cf6",
          500: "#6c4df6",
          600: "#5a3de0",
          700: "#4a2fc4",
          800: "#3c26a0",
          900: "#2f1f7d",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

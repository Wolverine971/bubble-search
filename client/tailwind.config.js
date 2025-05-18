/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
    // Add Rewind UI styles
    "./node_modules/@rewind-ui/core/dist/theme/styles/*.js",
  ],
  plugins: [
    require("@tailwindcss/typography"),

    require("@tailwindcss/forms")({
      strategy: "class", // only generate classes
    }),
    require("tailwind-scrollbar"),
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
};

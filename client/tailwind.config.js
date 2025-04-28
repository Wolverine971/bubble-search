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
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
    },
  },
};

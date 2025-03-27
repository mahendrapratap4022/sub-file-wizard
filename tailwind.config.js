module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // This tells Tailwind to look in your src folder for JSX/TSX files
  ],
  darkMode: "class",
  theme: {
    extend: {}, // You can extend the default Tailwind theme here
  },
  plugins: [], // Add any plugins you might want to use
};

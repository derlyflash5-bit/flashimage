module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1a1a1a", // Noir
        secondary: "#f5f5f5", // Blanc cassé
        accent: "#d4af37", // Or
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
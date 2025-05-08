/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F5F5", // Light background like Entourage Spark
        textPrimary: "#1A202C", // Dark text for contrast
        textMuted: "#718096", // Muted gray for secondary text
        accentOrange: "#F6A623", // Orange for icons/buttons
        accentGreen: "#38A169", // Green for verified badges
        accentPurple: "#805AD5", // Purple for tags
        cardBg: "#FFFFFF", // White background for cards
        border: "#E2E8F0", // Light gray border
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Modern sans-serif font
        mono: ['"Fira Code"', "monospace"], // For code-like elements
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow for cards
      },
      borderRadius: {
        lg: "12px", // Rounded corners for cards
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1E8E5A", dark: "#16724A", light: "#2FA86F", soft: "#E7F5EE", softDark: "#16301F" },
        ink: { DEFAULT: "#14211A", soft: "#5B6B62", mute: "#8A978F" },
        line: { DEFAULT: "#E3EAE5", dark: "#26332B" },
        surface: { DEFAULT: "#F4F7F5", dark: "#0E1511", card: "#FFFFFF", cardDark: "#161F1A", raised: "#F0F4F1", raisedDark: "#1D2822" },
        water: "#3B82C4",
        warn: "#C2852B",
        danger: "#C2455F",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: { card: "0 1px 2px rgba(20,33,26,.04), 0 4px 16px rgba(20,33,26,.04)" },
    },
  },
  plugins: [],
};

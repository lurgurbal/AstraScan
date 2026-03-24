/** @type {import('tailwindcss').Config} */
module.exports = {
  // Fichiers dans lesquels Tailwind scanne les classes
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      // Polices liées aux variables CSS injectées par Next.js Font
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      // Animation personnalisée pour le ResultCard
      keyframes: {
        fadeSlideIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeSlideIn: "fadeSlideIn 0.4s ease-out",
      },
      // Couleurs additionnelles si besoin
      colors: {
        scam: {
          red:   "#ef4444",
          amber: "#f59e0b",
          green: "#10b981",
        },
      },
    },
  },
  plugins: [],
};

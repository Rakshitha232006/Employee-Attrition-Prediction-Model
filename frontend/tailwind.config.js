/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', "Inter", "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        slate: {
          950: "#020617",
        },
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.2), transparent)",
        "glow-blue":
          "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.1) 100%)",
      },
      boxShadow: {
        neon: "0 0 60px rgba(16, 185, 129, 0.15), 0 0 1px rgba(16, 185, 129, 0.4)",
        card: "0 12px 48px rgba(0, 0, 0, 0.55)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

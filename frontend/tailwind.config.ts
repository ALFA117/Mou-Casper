import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        surface: {
          DEFAULT: "#0B1220",
          2: "#0F172A",
          3: "#141F33",
        },
        border: {
          DEFAULT: "#22314A",
          subtle: "#182236",
        },
        foreground: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          faint: "#5B6B85",
        },
        brand: {
          DEFAULT: "#22C55E",
          dim: "#15803D",
          glow: "#4ADE80",
        },
        senior: {
          DEFAULT: "#38BDF8",
          dim: "#0369A1",
          glow: "#7DD3FC",
        },
        junior: {
          DEFAULT: "#F59E0B",
          dim: "#B45309",
          glow: "#FCD34D",
        },
        danger: {
          DEFAULT: "#EF4444",
          dim: "#991B1B",
          glow: "#FCA5A5",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(148,163,184,0.08), 0 8px 30px -8px rgba(0,0,0,0.6)",
        "glow-brand": "0 0 24px -4px rgba(34,197,94,0.45)",
        "glow-senior": "0 0 24px -4px rgba(56,189,248,0.45)",
        "glow-junior": "0 0 24px -4px rgba(245,158,11,0.45)",
        "glow-danger": "0 0 32px -4px rgba(239,68,68,0.55)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56,189,248,0.12), transparent)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "flash-danger": "flash-danger 0.9s ease-in-out",
        "count-flicker": "count-flicker 0.4s ease-in-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "flash-danger": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
          "30%": { boxShadow: "0 0 0 6px rgba(239,68,68,0.25)" },
        },
        "count-flicker": {
          "0%": { opacity: "1" },
          "50%": { opacity: "0.3" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

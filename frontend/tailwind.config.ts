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
        background: "#0A0A0A",
        surface: {
          DEFAULT: "#111111",
          2: "#161616",
          3: "#1D1D1D",
        },
        border: {
          DEFAULT: "#2A2A2A",
          subtle: "#1C1C1C",
        },
        foreground: {
          DEFAULT: "#FFFFFF",
          muted: "#A6A6AC",
          faint: "#6E6E76",
        },
        // Casper red — marca/acento primario. Nunca como color de texto corrido.
        brand: {
          DEFAULT: "#FF1F1F",
          dim: "#8C1010",
          glow: "#FF5C5C",
        },
        // Senior tranche: cromo/blanco contenido — "bajo riesgo" se lee frio, no rojo.
        senior: {
          DEFAULT: "#E7E7EA",
          dim: "#8E8E96",
          glow: "#FFFFFF",
        },
        // Junior tranche: ascua/ember — misma familia que brand pero mas calida y
        // ligeramente distinta, para que A y B se distingan incluso lado a lado.
        junior: {
          DEFAULT: "#FF4D2E",
          dim: "#8C2A18",
          glow: "#FF9270",
        },
        // Alerta de alta tension (boton mark_default, exposure exceeded, badges de
        // slash %) — carmesi mas caliente que brand, para el build-up ANTES del
        // momento del slash. El momento en si usa `carbon`, no este tono.
        danger: {
          DEFAULT: "#E8112B",
          dim: "#7A0A17",
          glow: "#FF5470",
        },
        // Dedicado exclusivamente al instante del slash: la tarjeta/nodo del
        // underwriter castigado se apaga aqui, no a "mas rojo" (ver ClimaxPanel /
        // UnderwriterCard / Background3D).
        carbon: {
          DEFAULT: "#4B4B52",
          dim: "#232326",
          glow: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        // Panel base: highlight interno arriba (luz "de arriba") + linea de
        // contorno + sombra ambiental — usado por Card/badges/toasts en todo
        // el dashboard, asi que un solo cambio le da profundidad a todo.
        glow: "inset 0 1px 0 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.06), 0 8px 30px -8px rgba(0,0,0,0.8)",
        "glow-brand": "0 0 24px -4px rgba(255,31,31,0.5)",
        "glow-senior": "0 0 20px -4px rgba(255,255,255,0.35)",
        "glow-junior": "0 0 24px -4px rgba(255,77,46,0.5)",
        "glow-danger": "0 0 28px -4px rgba(232,17,43,0.55)",
        "glow-carbon": "0 0 22px -2px rgba(255,255,255,0.3)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,31,31,0.14), transparent)",
        "grid-lines":
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        scanlines:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
        "hero-glow": "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(255,31,31,0.22), transparent 70%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "flash-danger": "flash-danger 0.9s ease-in-out",
        "slash-flash": "slash-flash 1.1s ease-out",
        "count-flicker": "count-flicker 0.4s ease-in-out",
        "glow-pulse": "glow-pulse 0.7s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%": { filter: "drop-shadow(0 0 0 currentColor)", opacity: "0.7" },
          "30%": { filter: "drop-shadow(0 0 7px currentColor)", opacity: "1" },
          "100%": { filter: "drop-shadow(0 0 0 currentColor)", opacity: "1" },
        },
        "flash-danger": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,17,43,0)" },
          "30%": { boxShadow: "0 0 0 6px rgba(232,17,43,0.3)" },
        },
        "slash-flash": {
          "0%": { backgroundColor: "rgba(255,255,255,0.9)", boxShadow: "0 0 40px 4px rgba(255,255,255,0.6)" },
          "100%": { backgroundColor: "rgba(75,75,82,0.1)", boxShadow: "0 0 0 0 rgba(255,255,255,0)" },
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

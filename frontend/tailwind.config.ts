import type { Config } from "tailwindcss";

const c = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Todos los colores salen de tokens CSS (canales RGB en globals.css) para
      // que el modo claro funcione y Tailwind pueda aplicar opacidad (bg-brand/30).
      colors: {
        background: c("background"),
        surface: { DEFAULT: c("surface"), 2: c("surface-2"), 3: c("surface-3") },
        border: { DEFAULT: c("border"), subtle: c("border-subtle") },
        foreground: { DEFAULT: c("fg"), muted: c("fg-muted"), faint: c("fg-faint") },
        // Casper red — marca/acento primario. Nunca como color de texto corrido.
        brand: { DEFAULT: c("brand"), dim: c("brand-dim"), glow: c("brand-glow") },
        // Senior tranche: cromo contenido — "bajo riesgo" se lee frio, no rojo.
        senior: { DEFAULT: c("senior"), dim: c("senior-dim"), glow: c("senior-glow") },
        // Junior tranche: ascua/ember, misma familia que brand pero mas calida.
        junior: { DEFAULT: c("junior"), dim: c("junior-dim"), glow: c("junior-glow") },
        // Alerta de alta tension antes del slash.
        danger: { DEFAULT: c("danger"), dim: c("danger-dim"), glow: c("danger-glow") },
        // Exclusivo del instante del slash: el underwriter castigado se apaga.
        carbon: { DEFAULT: c("carbon"), dim: c("carbon-dim"), glow: c("carbon-glow") },
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
        glow: "inset 0 1px 0 0 rgb(var(--hl) / 0.07), 0 0 0 1px rgb(var(--hl) / 0.06), 0 8px 30px -8px rgb(var(--shadow) / 0.8)",
        "glow-brand": "0 0 24px -4px rgb(var(--brand) / 0.5)",
        "glow-senior": "0 0 20px -4px rgb(var(--senior-glow) / 0.35)",
        "glow-junior": "0 0 24px -4px rgb(var(--junior) / 0.5)",
        "glow-danger": "0 0 28px -4px rgb(var(--danger) / 0.55)",
        "glow-carbon": "0 0 22px -2px rgb(var(--carbon-glow) / 0.3)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(var(--brand) / 0.14), transparent)",
        "grid-lines":
          "linear-gradient(rgb(var(--hl) / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--hl) / 0.05) 1px, transparent 1px)",
        scanlines:
          "repeating-linear-gradient(0deg, rgb(var(--hl) / 0.025) 0px, rgb(var(--hl) / 0.025) 1px, transparent 1px, transparent 3px)",
        "hero-glow": "radial-gradient(ellipse 60% 80% at 50% 0%, rgb(var(--brand) / 0.22), transparent 70%)",
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

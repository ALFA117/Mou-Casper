import type { Config } from "tailwindcss";

// Todos los colores salen de variables CSS (app/globals.css) para que el modo
// claro y el oscuro compartan nombres. Significado fijo:
//   brand  = rojo Casper: marca, riesgo junior, perdida y slash.
//   senior = azul tinta: tramo senior, underwriter_A (conservador), lo protegido.
//   carbon = gris: lo ya castigado / apagado.
const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: v("bg"),
        surface: {
          DEFAULT: v("surface"),
          2: v("surface-2"),
          3: v("surface-3"),
        },
        border: {
          DEFAULT: v("border"),
          subtle: v("border-subtle"),
          strong: v("border-strong"),
        },
        foreground: {
          DEFAULT: v("fg"),
          muted: v("fg-muted"),
          faint: v("fg-faint"),
        },
        brand: {
          DEFAULT: v("brand"),
          dim: v("brand-dim"),
          glow: v("brand-text"),
          ink: v("on-brand"),
        },
        senior: {
          DEFAULT: v("senior"),
          dim: v("senior-dim"),
          glow: v("senior-text"),
        },
        junior: {
          DEFAULT: v("brand"),
          dim: v("brand-dim"),
          glow: v("brand-text"),
        },
        danger: {
          DEFAULT: v("brand"),
          dim: v("brand-dim"),
          glow: v("brand-text"),
        },
        carbon: {
          DEFAULT: v("carbon"),
          dim: v("surface-3"),
          glow: v("fg"),
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        // Un solo radio para tarjetas, controles y chips.
        DEFAULT: "6px",
      },
      boxShadow: {
        // Sombras duras y discretas (sin desenfoque): solo en lo que se presiona
        // o en el panel que contiene el resultado principal.
        hard: "3px 3px 0 0 rgb(var(--c-shadow) / var(--shadow-a))",
        "hard-sm": "2px 2px 0 0 rgb(var(--c-shadow) / var(--shadow-a))",
        "hard-brand": "3px 3px 0 0 rgb(var(--c-brand) / 0.35)",
        none: "none",
      },
      animation: {
        rise: "rise 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "slash-flash": "slash-flash 1.1s ease-out",
        "glow-pulse": "value-pulse 0.6s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slash-flash": {
          "0%": { backgroundColor: "rgb(var(--c-brand) / 0.18)" },
          "100%": { backgroundColor: "transparent" },
        },
        "value-pulse": {
          "0%": { opacity: "0.55" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type Theme = "dark" | "light";
const KEY = "aval-theme";

/** Corre antes del primer pintado (inline en <head>): sin parpadeo blanco ni negro. */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('${KEY}');var l=s?s==='light':window.matchMedia('(prefers-color-scheme: light)').matches;var c=document.documentElement.classList;c.toggle('light',l);c.toggle('dark',!l);}catch(e){}})();`;

/** Noche ↔ día. Guarda la elección; sin elección sigue al sistema. */
export function ThemeToggle() {
  const { locale } = useI18n();
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const c = document.documentElement.classList;
    c.toggle("light", next === "light");
    c.toggle("dark", next === "dark");
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* modo privado: el tema dura solo esta visita */
    }
    setTheme(next);
  }

  const label =
    locale === "es"
      ? theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      : theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <motion.button
      type="button"
      onClick={flip}
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className="relative inline-flex size-11 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2/80 text-foreground-muted transition-colors hover:border-brand/50 hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2 }}
        >
          {theme === "dark" ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

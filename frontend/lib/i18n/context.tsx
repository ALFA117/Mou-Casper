"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionary, type Locale, type TranslationKey } from "./dictionary";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readLocaleFromUrl(): Locale | null {
  if (typeof window === "undefined") return null;
  const lang = new URLSearchParams(window.location.search).get("lang");
  return lang === "es" || lang === "en" ? lang : null;
}

/**
 * Estado en memoria (default "en", jurado internacional) + query param
 * `?lang=es|en` — a proposito SIN localStorage, para que funcione igual en
 * Vercel y en un artifact aislado. Se sincroniza con la URL via
 * history.replaceState, sin depender de los hooks de navegacion de Next
 * (evita el requisito de Suspense boundary de useSearchParams).
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const fromUrl = readLocaleFromUrl();
    if (fromUrl) setLocaleState(fromUrl);
  }, []);

  // Mantiene <html lang> correcto para lectores de pantalla — el default del
  // SSR es "en" (ver layout.tsx) y esto lo corrige apenas se conoce el real.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let str: string = dictionary[locale][key] ?? dictionary.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{{${k}}}`, String(v));
        }
      }
      return str;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  return ctx;
}

"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "en", label: "EN", name: "English" },
  { value: "es", label: "ES", name: "Español" },
] as const;

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex items-center rounded border border-border bg-surface p-0.5 text-sm font-medium" role="group" aria-label="Language / Idioma">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          aria-pressed={locale === opt.value}
          aria-label={opt.name}
          className={cn(
            "min-h-10 min-w-10 rounded-[4px] px-2 font-mono text-[13px] transition-colors duration-150",
            locale === opt.value ? "bg-foreground text-background" : "text-foreground-muted hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

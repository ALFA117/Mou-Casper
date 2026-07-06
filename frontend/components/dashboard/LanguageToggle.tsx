"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
] as const;

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface-2/80 p-0.5 text-xs font-medium">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          aria-pressed={locale === opt.value}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors duration-150",
            locale === opt.value ? "bg-brand text-background" : "text-foreground-muted hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

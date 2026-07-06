"use client";

import { Zap, Sparkles, Boxes } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const STACK_BADGES: { icon: typeof Zap; labelKey: TranslationKey; tooltipKey?: TranslationKey }[] = [
  { icon: Zap, labelKey: "hero.badge.x402", tooltipKey: "tooltip.x402" },
  { icon: Sparkles, labelKey: "hero.badge.gemini" },
  { icon: Boxes, labelKey: "hero.badge.casper" },
];

/**
 * First thing a judge reads — plain English (default) or Spanish, no jargon,
 * states the thesis before any of the numbered steps. Everything it claims is
 * demonstrated live below (real x402 payments, real LLM quotes, real
 * on-chain slashing).
 */
export function Hero() {
  const { t } = useI18n();
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-56 bg-hero-glow blur-2xl sm:-top-24 sm:h-72"
        aria-hidden
      />
      <section className="relative rounded-2xl border border-border bg-surface/60 p-6 shadow-glow sm:p-8">
        <span className="absolute left-3 top-3 size-3 border-2 border-b-0 border-r-0 border-brand/50 rounded-tl-[3px]" aria-hidden />
        <span className="absolute right-3 top-3 size-3 border-2 border-b-0 border-l-0 border-brand/50 rounded-tr-[3px]" aria-hidden />
        <span className="absolute bottom-3 left-3 size-3 border-2 border-t-0 border-r-0 border-brand/50 rounded-bl-[3px]" aria-hidden />
        <span className="absolute bottom-3 right-3 size-3 border-2 border-t-0 border-l-0 border-brand/50 rounded-br-[3px]" aria-hidden />
        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          {t("hero.headlinePre")} <span className="text-brand-glow">{t("hero.headlineEmphasis")}</span>{" "}
          {t("hero.headlinePost")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
          {t("hero.subcopyPre")} <span className="text-foreground">{t("hero.subcopyEmphasis")}</span>{" "}
          {t("hero.subcopyPost")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {STACK_BADGES.map(({ icon: Icon, labelKey, tooltipKey }) => {
            const label = t(labelKey);
            return (
              <span
                key={labelKey}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/80 px-3 py-1.5 text-xs font-medium text-foreground-muted"
              >
                <Icon className="size-3.5 text-brand-glow" aria-hidden />
                {label}
                {tooltipKey && <InfoTooltip label={t("tooltip.whatIs", { term: label })}>{t(tooltipKey)}</InfoTooltip>}
              </span>
            );
          })}
        </div>
      </section>
    </div>
  );
}

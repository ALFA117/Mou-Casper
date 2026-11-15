"use client";

import { RefreshCw, Radio as LiveIcon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/dashboard/LanguageToggle";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { DemoBudget } from "@/lib/types";
import { formatCspr } from "@/lib/utils";

// Env var apagable sin romper Vercel: si no está seteada, el enlace a la demo
// en vivo (túnel) simplemente no se renderiza.
const LIVE_DEMO_URL = process.env.NEXT_PUBLIC_LIVE_DEMO_URL;

const NAV: { href: string; key: TranslationKey }[] = [
  { href: "#underwriting", key: "nav.underwriters" },
  { href: "#vault", key: "nav.vault" },
  { href: "#climax", key: "nav.default" },
  { href: "#attestations", key: "nav.ledger" },
  { href: "#run-locally", key: "nav.local" },
];

export function SiteHeader({
  loading,
  readOnly,
  demoBudget,
  onRefresh,
}: {
  loading: boolean;
  readOnly: boolean;
  demoBudget: DemoBudget | null;
  onRefresh: () => void;
}) {
  const { t } = useI18n();

  return (
    <header>
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3" aria-label="AVAL">
            <Logo className="size-9 shrink-0" />
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="font-display text-xl font-bold tracking-[0.04em] text-foreground">AVAL</span>
              <span className="hidden truncate text-sm text-foreground-faint sm:inline">Mou Casper</span>
            </span>
          </a>

          <nav aria-label={t("nav.label")} className="hidden items-center gap-1 lg:flex">
            {NAV.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="rounded px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-3 hover:text-foreground"
              >
                {t(item.key)}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {LIVE_DEMO_URL && (
              <a
                href={LIVE_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded border border-brand/40 px-3 py-2 text-sm font-medium text-brand-glow hover:bg-brand-dim md:inline-flex"
              >
                <LiveIcon className="size-4" aria-hidden />
                {t("header.liveDemoBanner")}
              </a>
            )}
            <LanguageToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              aria-label={loading ? t("header.refreshing") : t("header.refresh")}
              className="px-3 disabled:border-transparent disabled:bg-transparent"
            >
              <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} aria-hidden />
              <span className="hidden sm:inline">{loading ? t("header.refreshing") : t("header.refresh")}</span>
            </Button>
          </div>
        </div>
        <nav aria-label={t("nav.label")} className="border-t border-border-subtle lg:hidden">
          <ul className="mx-auto flex max-w-[1240px] overflow-x-auto px-2 sm:px-4 [scrollbar-width:none]">
            {NAV.map(item => (
              <li key={item.href} className="shrink-0">
                <a
                  href={item.href}
                  className="flex min-h-11 items-center px-3 text-sm text-foreground-muted transition-colors hover:text-foreground"
                >
                  {t(item.key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {!readOnly && demoBudget && (
        <div className="border-b border-border bg-surface-2">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 text-[13px] text-foreground-muted sm:px-6 lg:px-8">
            <span className="flex items-center gap-2">
              <Wallet className="size-4 shrink-0 text-foreground-faint" aria-hidden />
              {t("budget.remaining", { amount: formatCspr(demoBudget.totalBalanceCspr, 1) })}
            </span>
            {demoBudget.isPublic && (
              <>
                <span>
                  {t("budget.hourlyCap", {
                    used: String(demoBudget.actionsUsedThisHour),
                    cap: String(demoBudget.actionsCapPerHour),
                  })}
                </span>
                {demoBudget.cooldownRemainingSeconds > 0 && (
                  <span className="text-brand-glow">
                    {t("budget.cooldown", { seconds: String(demoBudget.cooldownRemainingSeconds) })}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

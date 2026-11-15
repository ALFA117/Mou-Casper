"use client";

import { useMemo } from "react";
import { ArrowDownRight, CloudOff, ShieldCheck } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CountUp } from "@/components/ui/CountUp";
import { buttonClasses } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/context";
import type { ChainState, DefaultChainRunEntry, RunLogEntry } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

/**
 * Primera pantalla: la tesis a la izquierda y, a la derecha, la posición que
 * se lee en vivo de la cadena. El último resultado (el slash) queda a un clic
 * en vez de cuatro pantallas de scroll.
 */
export function Hero({
  chainState,
  runLog,
  runLogReady,
  loading,
  readOnly,
}: {
  chainState: ChainState | null;
  runLog: RunLogEntry[];
  runLogReady: boolean;
  loading: boolean;
  readOnly: boolean;
}) {
  const { t, locale } = useI18n();

  const a = chainState?.underwriters.underwriter_A ?? null;
  const b = chainState?.underwriters.underwriter_B ?? null;
  const totalStake = a && b ? a.stakeCspr + b.stakeCspr : null;
  const avgReputation = a && b ? Math.round((a.reputation + b.reputation) / 2) : null;
  const maxStake = Math.max(1, a?.stakeCspr ?? 0, b?.stakeCspr ?? 0);

  const lastDefault = useMemo(() => {
    const matches = runLog.filter((e): e is DefaultChainRunEntry => e.type === "default_chain");
    return matches.length ? matches[matches.length - 1] : null;
  }, [runLog]);

  const status = chainState ? "live" : loading ? "loading" : "down";

  return (
    <section id="top" className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14 lg:px-8 lg:py-16">
        <div className="flex min-w-0 flex-col justify-center">
          <p className="kicker">{t("hero.eyebrow")}</p>
          <h1 className="mt-4 text-balance font-display text-[40px] font-semibold leading-[1.04] tracking-[-0.01em] text-foreground sm:text-5xl lg:text-[58px]">
            {t("hero.headlinePre")} <span className="text-brand-glow">{t("hero.headlineEmphasis")}</span>{" "}
            {t("hero.headlinePost")}
          </h1>
          <p className="mt-5 max-w-[54ch] text-pretty text-[17px] leading-relaxed text-foreground-muted sm:text-lg">
            {t("hero.lede")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#climax" className={buttonClasses("primary", "lg")}>
              {t("hero.ctaOutcome")}
              <ArrowDownRight className="size-4" aria-hidden />
            </a>
            <a href="#attestations" className={buttonClasses("secondary", "lg")}>
              {t("hero.ctaLedger")}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground-muted">
            <li className="flex items-center gap-1.5">
              {t("hero.badge.x402")}
              <InfoTooltip label={t("tooltip.whatIs", { term: t("hero.badge.x402") })}>{t("tooltip.x402")}</InfoTooltip>
            </li>
            <li aria-hidden className="hidden h-4 w-px bg-border sm:block" />
            <li>{t("hero.badge.gemini")}</li>
            <li aria-hidden className="hidden h-4 w-px bg-border sm:block" />
            <li>{t("hero.badge.casper")}</li>
          </ul>

          <p className="mt-6 flex max-w-[62ch] gap-2.5 border-l-2 border-senior pl-3 text-sm leading-relaxed text-foreground-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-senior-glow" aria-hidden />
            {t("hero.disclosure")}
          </p>
        </div>

        <aside aria-labelledby="position-title" className="panel min-w-0 self-start shadow-hard">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
            <h2 id="position-title" className="font-display text-lg font-semibold text-foreground">
              {t("position.title")}
            </h2>
            <span
              role="status"
              aria-live="polite"
              className={cn(
                "inline-flex items-center gap-2 font-mono text-xs",
                status === "down" ? "text-brand-glow" : "text-foreground-muted"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  status === "live" ? "bg-senior" : status === "loading" ? "animate-pulse bg-carbon" : "bg-brand"
                )}
              />
              {status === "live" ? t("header.liveBadge") : status === "loading" ? t("header.refreshing") : t("position.unavailable")}
            </span>
          </div>

          <div className="px-5 pb-5 pt-5">
            <p className="label">{t("header.stat.totalStake")}</p>
            <p className="mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums text-foreground sm:text-4xl">
              {totalStake === null ? "—" : <CountUp value={totalStake} decimals={2} />}
              <span className="ml-2 text-lg font-medium text-foreground-faint">CSPR</span>
            </p>

            <dl className="mt-5 space-y-3">
              {(
                [
                  ["underwriter_A", a, "senior"],
                  ["underwriter_B", b, "brand"],
                ] as const
              ).map(([wallet, u, tone]) => (
                <div key={wallet}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <dt className="text-foreground-muted">{t("position.stakeOf", { wallet })}</dt>
                    <dd className="font-mono tabular-nums text-foreground">
                      {u ? <CountUp value={u.stakeCspr} decimals={2} suffix=" CSPR" /> : "—"}
                    </dd>
                  </div>
                  <ProgressBar value={u?.stakeCspr ?? 0} max={maxStake} tone={tone} trackClassName="mt-1.5" label={wallet} />
                </div>
              ))}
            </dl>
          </div>

          <dl className="grid grid-cols-2 border-t border-border-subtle text-sm">
            <div className="border-r border-border-subtle px-5 py-4">
              <dt className="text-foreground-muted">{t("header.stat.avgReputation")}</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums text-foreground">
                {avgReputation === null ? "—" : <CountUp value={avgReputation} />}
                <span className="text-foreground-faint">/1000</span>
              </dd>
            </div>
            <div className="px-5 py-4">
              <dt className="text-foreground-muted">{t("header.stat.events")}</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums text-foreground">{runLogReady ? runLog.length : "—"}</dd>
            </div>
          </dl>

          <a
            href="#climax"
            className="group flex items-center justify-between gap-4 border-t border-border-subtle px-5 py-4 transition-colors hover:bg-surface-2"
          >
            <span className="min-w-0">
              <span className="label block">{t("position.lastOutcome")}</span>
              {lastDefault ? (
                <>
                  <span className="mt-1 block font-mono text-[15px] font-medium text-brand-glow">
                    {t("position.outcomeValue", { pct: `${(lastDefault.slashBps / 100).toFixed(2)}%` })}
                  </span>
                  <span className="block text-[13px] text-foreground-faint">
                    {t("position.outcomeDate", { date: formatDate(lastDefault.loggedAt, locale) })}
                  </span>
                </>
              ) : (
                <span className="mt-1 block text-sm text-foreground-muted">
                  {runLogReady ? t("position.noOutcome") : "—"}
                </span>
              )}
            </span>
            <ArrowDownRight
              className="size-5 shrink-0 text-foreground-faint transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
              aria-hidden
            />
          </a>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border-subtle bg-surface-2 px-5 py-3 text-[13px] text-foreground-faint">
            <span>{t("position.source")}</span>
            <span className="whitespace-nowrap font-mono tabular-nums">
              {t("header.stat.lastRead")}: {chainState ? new Date(chainState.readAt).toLocaleTimeString(locale === "es" ? "es-MX" : "en-GB") : "—"}
            </span>
          </div>

          {readOnly && (
            <p className="flex gap-2.5 border-t border-border-subtle px-5 py-3.5 text-[13px] leading-relaxed text-foreground-muted">
              <CloudOff className="mt-0.5 size-4 shrink-0 text-foreground-faint" aria-hidden />
              {t("header.readOnlyBanner")}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

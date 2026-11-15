"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Flame, Zap, Stamp, Skull, Lock, FileCheck2, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TxLink } from "@/components/ui/TxLink";
import { CountUp } from "@/components/ui/CountUp";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ReadOnlyNote } from "@/components/ui/ReadOnlyNote";
import { useI18n } from "@/lib/i18n/context";
import type { UnderwriterRunEntry } from "@/lib/types";
import { ACTION_COST_ESTIMATES_CSPR } from "@/lib/dashboard-config";
import { cn, formatBps, formatDate } from "@/lib/utils";

// Las corridas del 25-jul no trajeron datos de riesgo (el pago x402 no se
// liquido) y riskData llega como {}: sin esto la tarjeta mostraba "NaN%".
function bpsOrDash(bps: number | undefined): string {
  return typeof bps === "number" && Number.isFinite(bps) ? formatBps(bps) : "—";
}

export function UnderwriterCard({
  wallet,
  profile,
  liveStakeCspr,
  liveReputation,
  latestRun,
  wasSlashed,
  stakeInputCspr,
  onStakeInputChange,
  busy,
  disabled,
  tooltip,
  onRun,
}: {
  wallet: "underwriter_A" | "underwriter_B";
  profile: "conservative" | "aggressive";
  liveStakeCspr: number | null; // null = todavia no hay lectura de la cadena
  liveReputation: number | null;
  latestRun: UnderwriterRunEntry | null;
  wasSlashed: boolean;
  stakeInputCspr: number;
  onStakeInputChange: (v: number) => void;
  busy: boolean;
  disabled: boolean;
  tooltip?: string;
  onRun: () => void;
}) {
  const { t, locale } = useI18n();
  const tone = profile === "conservative" ? "senior" : "junior";
  const quote = latestRun?.quote;
  const hasRiskData = typeof latestRun?.riskData?.defaultProbabilityBps === "number";

  // Flash blanco una sola vez cuando el slash recien confirma (no en cada
  // refresco de polling posterior) — el estado "apagado" despues es permanente.
  const [justFlashed, setJustFlashed] = useState(false);
  const wasSlashedBefore = useRef(wasSlashed);
  useEffect(() => {
    if (wasSlashed && !wasSlashedBefore.current) {
      setJustFlashed(true);
      const timer = setTimeout(() => setJustFlashed(false), 1100);
      return () => clearTimeout(timer);
    }
    wasSlashedBefore.current = wasSlashed;
  }, [wasSlashed]);

  const iconTone = wasSlashed
    ? "border-border bg-surface-3 text-foreground-muted"
    : tone === "senior"
      ? "border-senior/30 bg-senior-dim text-senior-glow"
      : "border-brand/30 bg-brand-dim text-brand-glow";

  return (
    <Card
      accent={wasSlashed ? "carbon" : tone}
      className={cn("flex flex-col", justFlashed && "animate-slash-flash")}
    >
      <CardHeader className="pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded border", iconTone)}>
            {wasSlashed ? (
              <Skull className="size-[18px]" aria-hidden />
            ) : tone === "senior" ? (
              <ShieldCheck className="size-[18px]" aria-hidden />
            ) : (
              <Flame className="size-[18px]" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <CardTitle className="font-mono text-base font-semibold">{wallet}</CardTitle>
            <p className={cn("text-[13px] leading-snug", wasSlashed ? "font-medium text-brand-glow" : "text-foreground-muted")}>
              {wasSlashed ? (
                t("underwriter.sliced")
              ) : (
                <>
                  <span className="whitespace-nowrap">{t(profile === "conservative" ? "underwriter.conservative" : "underwriter.aggressive")}</span>
                  <span className="block whitespace-nowrap text-foreground-faint">Gemini 2.5 Flash</span>
                </>
              )}
            </p>
          </div>
        </div>
        {quote && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-foreground-faint">{t("underwriter.rating")}</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {quote.rating}
              <span className="text-sm font-normal text-foreground-faint">/1000</span>
            </p>
          </div>
        )}
      </CardHeader>

      {/* Stake y reputacion leidos on-chain */}
      <div className="grid grid-cols-2 border-b border-border-subtle">
        <div className="min-w-0 border-r border-border-subtle px-5 py-4 sm:px-6">
          <p className="flex items-center gap-1 whitespace-nowrap text-[13px] text-foreground-muted">
            {t("underwriter.stakeLabel")}
            <InfoTooltip label={t("tooltip.whatIs", { term: "stake" })}>{t("underwriter.stakeTooltip")}</InfoTooltip>
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
            {liveStakeCspr === null ? "—" : <CountUp value={liveStakeCspr} decimals={2} />}
            <span className="ml-1 text-sm font-normal text-foreground-faint">CSPR</span>
          </p>
        </div>
        <div className="min-w-0 px-5 py-4 sm:px-6">
          <p className="whitespace-nowrap text-[13px] text-foreground-muted">{t("underwriter.reputationLabel")}</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
            {liveReputation === null ? "—" : <CountUp value={liveReputation} />}
            <span className="text-sm font-normal text-foreground-faint">/1000</span>
          </p>
          <ProgressBar
            value={liveReputation ?? 0}
            max={1000}
            tone={wasSlashed ? "carbon" : tone}
            trackClassName="mt-2"
            label={t("underwriter.reputationLabel")}
          />
        </div>
      </div>

      <CardBody className="flex-1 space-y-4">
        {quote ? (
          <>
            <div>
              <p className="text-[13px] text-foreground-faint">
                {t("underwriter.latestQuote", {
                  assetId: latestRun!.assetId,
                  date: formatDate(latestRun!.loggedAt, locale),
                })}
              </p>
              <dl className="mt-2 divide-y divide-border-subtle border-y border-border-subtle text-sm">
                <Stat label={t("underwriter.recommendedTranche")} value={quote.recommended_tranche} capitalize />
                <Stat label={t("underwriter.quotedSpread")} value={formatBps(quote.price_bps)} mono />
                <Stat label={t("underwriter.feedPd")} value={bpsOrDash(latestRun!.riskData?.defaultProbabilityBps)} mono />
                <Stat label={t("underwriter.marketSpread")} value={bpsOrDash(latestRun!.riskData?.recommendedSpreadBps)} mono />
              </dl>
              {!hasRiskData && (
                <p className="mt-3 border-l-2 border-brand pl-3 text-[13px] leading-relaxed text-foreground-muted">
                  {t("underwriter.noRiskData")}
                </p>
              )}
            </div>

            <details className="group rounded border border-border-subtle bg-surface-2">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {t("underwriter.rationale")}
                <ChevronDown className="size-4 text-foreground-faint transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="border-t border-border-subtle px-3 py-3 text-[13px] leading-relaxed text-foreground-muted">
                {quote.short_reasoning}
              </p>
            </details>

            <ul className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-[13px] text-foreground-muted">
              {latestRun!.hashes.x402 && (
                <li className="flex items-center gap-1.5">
                  <Zap className="size-3.5 shrink-0 text-foreground-faint" aria-hidden />
                  <span className="w-16 shrink-0">x402</span> <TxLink hash={latestRun!.hashes.x402} />
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <Stamp className="size-3.5 shrink-0 text-foreground-faint" aria-hidden />
                <span className="w-16 shrink-0">register</span> <TxLink hash={latestRun!.hashes.register} />
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="size-3.5 shrink-0 text-foreground-faint" aria-hidden />
                <span className="w-16 shrink-0">stake</span> <TxLink hash={latestRun!.hashes.stake} />
              </li>
              <li className="flex items-center gap-1.5">
                <FileCheck2 className="size-3.5 shrink-0 text-foreground-faint" aria-hidden />
                <span className="w-16 shrink-0">attest</span> <TxLink hash={latestRun!.hashes.attest} />
              </li>
            </ul>
          </>
        ) : (
          <div className="rounded border border-dashed border-border px-4 py-6 text-center text-sm text-foreground-muted">
            {t("underwriter.noRunsYet")}
          </div>
        )}
      </CardBody>

      <div className="space-y-2.5 border-t border-border-subtle bg-surface-2 px-5 py-3 sm:px-6">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`stake-${wallet}`}>
          {t("underwriter.stakeInputLabel")}
        </label>
        <input
          id={`stake-${wallet}`}
          type="number"
          min={1}
          value={stakeInputCspr}
          onChange={e => onStakeInputChange(Number(e.target.value) || 0)}
          disabled={disabled}
          className="field w-20"
        />
        <span title={tooltip} className="min-w-0 flex-1">
          <Button size="sm" variant="secondary" onClick={onRun} disabled={disabled} loading={busy} className="w-full">
            {t("underwriter.runButton", { cost: ACTION_COST_ESTIMATES_CSPR.runUnderwriter })}
          </Button>
        </span>
      </div>
      <ReadOnlyNote show={Boolean(tooltip)} />
      </div>
    </Card>
  );
}

function Stat({ label, value, capitalize, mono }: { label: string; value: string; capitalize?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className={cn("font-medium text-foreground", mono && "font-mono tabular-nums", capitalize && "capitalize")}>{value}</dd>
    </div>
  );
}

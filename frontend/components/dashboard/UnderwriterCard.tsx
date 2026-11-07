"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Flame, Zap, Stamp, Skull } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TxLink } from "@/components/ui/TxLink";
import { CountUp } from "@/components/ui/CountUp";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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

  return (
    <Card
      accent={wasSlashed ? "carbon" : tone}
      className={cn("relative overflow-hidden transition-colors duration-700", wasSlashed && "grayscale", justFlashed && "animate-slash-flash")}
    >
      <CardHeader className="flex-wrap gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              wasSlashed
                ? "bg-carbon/20 text-foreground-muted"
                : tone === "senior"
                  ? "bg-senior/10 text-senior-glow"
                  : "bg-junior/10 text-junior-glow"
            )}
          >
            {wasSlashed ? (
              <Skull className="size-4" aria-hidden />
            ) : tone === "senior" ? (
              <ShieldCheck className="size-4" aria-hidden />
            ) : (
              <Flame className="size-4" aria-hidden />
            )}
          </div>
          <div>
            <CardTitle className={wasSlashed ? "text-foreground-muted" : undefined}>{wallet}</CardTitle>
            <p className="text-xs text-foreground-muted">
              {wasSlashed
                ? t("underwriter.sliced")
                : `${t(profile === "conservative" ? "underwriter.conservative" : "underwriter.aggressive")} · Gemini 2.5 Flash`}
            </p>
          </div>
        </div>
        <Badge
          variant={wasSlashed ? "carbon" : tone}
          className="shrink-0 whitespace-nowrap font-mono"
        >
          {liveStakeCspr === null ? "— CSPR" : <CountUp value={liveStakeCspr} decimals={3} suffix=" CSPR" />}{" "}
          {t("underwriter.atStake")}
        </Badge>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Cotizacion mas reciente (real, de run-log.json) */}
        {quote ? (
          <div className="rounded-xl border border-border-subtle bg-surface-2/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-foreground-faint">
                {t("underwriter.latestQuote", {
                  assetId: latestRun!.assetId,
                  date: formatDate(latestRun!.loggedAt, locale),
                })}
              </span>
              <Badge variant={tone} className="font-mono">{quote.rating}/1000</Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <Stat label={t("underwriter.recommendedTranche")} value={quote.recommended_tranche} capitalize />
              <Stat label={t("underwriter.quotedSpread")} value={formatBps(quote.price_bps)} mono />
              <Stat label={t("underwriter.feedPd")} value={bpsOrDash(latestRun!.riskData?.defaultProbabilityBps)} mono />
              <Stat label={t("underwriter.marketSpread")} value={bpsOrDash(latestRun!.riskData?.recommendedSpreadBps)} mono />
            </div>
            {!hasRiskData && (
              <p className="mt-2 rounded-md border border-junior/30 bg-junior/5 px-2 py-1.5 text-xs text-foreground-muted">
                {t("underwriter.noRiskData")}
              </p>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-foreground-muted">{quote.short_reasoning}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {latestRun!.hashes.x402 && (
                <span className="flex items-center gap-1 text-foreground-muted">
                  <Zap className="size-3" aria-hidden /> x402 <TxLink hash={latestRun!.hashes.x402} />
                </span>
              )}
              <span className="flex items-center gap-1 text-foreground-muted">
                <Stamp className="size-3 text-brand-glow" aria-hidden /> register <TxLink hash={latestRun!.hashes.register} />
              </span>
              <span className="flex items-center gap-1 text-foreground-muted">stake <TxLink hash={latestRun!.hashes.stake} /></span>
              <span className="flex items-center gap-1 text-foreground-muted">attest <TxLink hash={latestRun!.hashes.attest} /></span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-subtle p-3 text-center text-xs text-foreground-faint">
            {t("underwriter.noRunsYet")}
          </div>
        )}

        {/* Stake en vivo (leido on-chain) */}
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="flex items-center gap-1 text-xs text-foreground-muted">
              {t("underwriter.stakeLabel")}
              <InfoTooltip label={t("tooltip.whatIs", { term: "stake" })}>{t("underwriter.stakeTooltip")}</InfoTooltip>
            </span>
            <span className="font-mono text-base font-semibold tabular-nums text-foreground">
              {liveStakeCspr === null ? "—" : <CountUp value={liveStakeCspr} decimals={3} suffix=" CSPR" />}
            </span>
          </div>
          <ProgressBar
            value={liveStakeCspr ?? 0}
            max={Math.max(1, liveStakeCspr ?? 0)}
            tone={wasSlashed ? "carbon" : tone}
          />
        </div>

        {/* Reputacion en vivo (leida on-chain, escala 0-1000) */}
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs text-foreground-muted">{t("underwriter.reputationLabel")}</span>
            <span className="font-mono text-base font-semibold tabular-nums text-foreground">
              {liveReputation === null ? "—" : <CountUp value={liveReputation} className="text-foreground" />}
              <span className="text-foreground-faint">/1000</span>
            </span>
          </div>
          <ProgressBar value={liveReputation ?? 0} max={1000} tone={wasSlashed ? "carbon" : "brand"} />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={stakeInputCspr}
            onChange={e => onStakeInputChange(Number(e.target.value) || 0)}
            disabled={disabled}
            className="h-9 w-20 rounded-lg border border-border-subtle bg-surface-2 px-2 text-xs text-foreground disabled:opacity-50"
            aria-label={t("underwriter.stakeInputLabel")}
          />
          <span title={tooltip} className="flex-1">
            <Button size="sm" onClick={onRun} disabled={disabled} loading={busy} className="w-full">
              {t("underwriter.runButton", { cost: ACTION_COST_ESTIMATES_CSPR.runUnderwriter })}
            </Button>
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({ label, value, capitalize, mono }: { label: string; value: string; capitalize?: boolean; mono?: boolean }) {
  return (
    <div>
      <div className="text-foreground-faint">{label}</div>
      <div className={cn("font-medium text-foreground", mono && "font-mono tabular-nums", capitalize && "capitalize")}>{value}</div>
    </div>
  );
}

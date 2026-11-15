"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Skull, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TxLink } from "@/components/ui/TxLink";
import { CountUp } from "@/components/ui/CountUp";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useI18n } from "@/lib/i18n/context";
import type { RunLogEntry, DefaultChainRunEntry, ConstitutionTestRunEntry, UnderwriterRunEntry } from "@/lib/types";
import { ACTION_COST_ESTIMATES_CSPR } from "@/lib/dashboard-config";
import { cn, formatBps, formatCspr, formatDate } from "@/lib/utils";

export function ClimaxPanel({
  assetId,
  runLog,
  busyAction,
  actionsDisabled,
  readOnlyTooltip,
  onMarkDefault,
}: {
  assetId: string;
  runLog: RunLogEntry[];
  busyAction: string | null;
  actionsDisabled: boolean;
  readOnlyTooltip?: string;
  onMarkDefault: (lossAmountCspr: number) => void;
}) {
  const { t, locale } = useI18n();
  const [lossAmount, setLossAmount] = useState(30);

  const lastDefaultChain = useMemo(() => {
    const matches = runLog.filter((e): e is DefaultChainRunEntry => e.type === "default_chain" && e.assetId === assetId);
    return matches.length ? matches[matches.length - 1] : null;
  }, [runLog, assetId]);

  // La cotizacion de B que estaba vigente cuando se marco ESTE default (no la
  // ultima del log, que puede ser de otra fecha): asi el resultado no mezcla
  // corridas distintas sin decirlo.
  const quoteBAtDefault = useMemo(() => {
    if (!lastDefaultChain) return null;
    const matches = runLog.filter(
      (e): e is UnderwriterRunEntry =>
        e.type === "underwriter" &&
        e.walletName === "underwriter_B" &&
        e.assetId === assetId &&
        e.loggedAt <= lastDefaultChain.loggedAt
    );
    return matches.length ? matches[matches.length - 1] : null;
  }, [runLog, assetId, lastDefaultChain]);

  const lastConstitutionTest = useMemo(() => {
    const matches = runLog.filter((e): e is ConstitutionTestRunEntry => e.type === "constitution_test");
    return matches.length ? matches[matches.length - 1] : null;
  }, [runLog]);

  // Flash blanco una sola vez cuando el resultado del slash recien aparece —
  // no en cada refresco de polling posterior sobre el mismo resultado.
  const [justFlashed, setJustFlashed] = useState(false);
  const hadResultBefore = useRef(lastDefaultChain !== null);
  useEffect(() => {
    const hasResult = lastDefaultChain !== null;
    if (hasResult && !hadResultBefore.current) {
      setJustFlashed(true);
      const timer = setTimeout(() => setJustFlashed(false), 1100);
      hadResultBefore.current = hasResult;
      return () => clearTimeout(timer);
    }
    hadResultBefore.current = hasResult;
  }, [lastDefaultChain]);

  return (
    <Card accent="brand" elevated className="" id="climax">
      <CardHeader className="pt-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded border border-brand/30 bg-brand-dim text-brand-glow">
            <Skull className="size-[18px]" aria-hidden />
          </div>
          <div className="max-w-[62ch]">
            <p className="kicker lg:hidden">04 · {t("step.default")}</p>
            <CardTitle className="flex items-center gap-1.5 text-xl">
              {t("climax.title")}
              <InfoTooltip label={t("tooltip.whatIs", { term: "slashing" })}>{t("climax.slashingTooltip")}</InfoTooltip>
            </CardTitle>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground-muted">{t("climax.description")}</p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-5">
        {lastDefaultChain ? (
          <div className={cn("rounded border border-border", justFlashed && "animate-slash-flash")}>
            <div className="grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end sm:gap-8">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">{t("climax.resultHeading")}</p>
                <p className="mt-2 font-mono text-5xl font-semibold leading-none tabular-nums text-brand-glow sm:text-6xl">
                  <CountUp value={lastDefaultChain.slashBps / 100} decimals={2} prefix="−" suffix="%" duration={900} startFromZero />
                </p>
                <p className="mt-2 text-[13px] text-foreground-muted">{t("climax.slashDetail")}</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground-muted sm:pb-1">
                {quoteBAtDefault && typeof quoteBAtDefault.riskData?.recommendedSpreadBps === "number"
                  ? t("climax.runContext", {
                      date: formatDate(lastDefaultChain.loggedAt, locale),
                      spread: formatBps(quoteBAtDefault.quote.price_bps),
                      market: formatBps(quoteBAtDefault.riskData.recommendedSpreadBps),
                    })
                  : formatDate(lastDefaultChain.loggedAt, locale)}
              </p>
            </div>

            <dl className="grid grid-cols-1 border-t border-border-subtle text-sm sm:grid-cols-3">
              <div className="border-b border-border-subtle px-5 py-3 sm:border-b-0 sm:border-r">
                <dt className="text-foreground-muted">{t("climax.reputationB")}</dt>
                <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums text-brand-glow">−{lastDefaultChain.penalizePoints}</dd>
              </div>
              <div className="border-b border-border-subtle px-5 py-3 sm:border-b-0 sm:border-r">
                <dt className="text-foreground-muted">{t("climax.reputationA")}</dt>
                <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums text-senior-glow">+{lastDefaultChain.rewardPoints}</dd>
              </div>
              <div className="px-5 py-3">
                <dt className="text-foreground-muted">{t("climax.lossLabel")}</dt>
                <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums text-foreground">
                  {formatCspr(lastDefaultChain.lossAmountCspr, 0)}
                </dd>
              </div>
            </dl>

            <ul className="grid grid-cols-1 gap-x-6 gap-y-0.5 border-t border-border-subtle bg-surface-2 px-5 py-3 text-[13px] text-foreground-muted sm:grid-cols-2">
              <li className="flex items-center gap-2"><span className="w-24 shrink-0 font-mono">mark_default</span><TxLink hash={lastDefaultChain.hashes.markDefault} /></li>
              <li className="flex items-center gap-2"><span className="w-24 shrink-0 font-mono">slash</span><TxLink hash={lastDefaultChain.hashes.slash} /></li>
              <li className="flex items-center gap-2"><span className="w-24 shrink-0 font-mono">penalize</span><TxLink hash={lastDefaultChain.hashes.penalize} /></li>
              <li className="flex items-center gap-2"><span className="w-24 shrink-0 font-mono">reward</span><TxLink hash={lastDefaultChain.hashes.reward} /></li>
            </ul>
          </div>
        ) : (
          <div className="rounded border border-dashed border-border px-5 py-8 text-center text-sm leading-relaxed text-foreground-muted">
            {t("climax.emptyState")}
          </div>
        )}

        {lastConstitutionTest && (
          <div className="rounded border border-border px-4 py-3.5 text-[13px] leading-relaxed">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className="flex gap-2.5 text-foreground">
                <ShieldAlert className={cn("mt-0.5 size-4 shrink-0", lastConstitutionTest.testPassed ? "text-senior-glow" : "text-brand-glow")} aria-hidden />
                {t("climax.constitutionTest", {
                  amount: formatCspr(lastConstitutionTest.requestedExposureCspr, 0),
                  result: t(lastConstitutionTest.testPassed ? "climax.reverted" : "climax.notReverted"),
                  error: lastConstitutionTest.errorName,
                })}
              </span>
              <span className="pl-6 sm:pl-0"><TxLink hash={lastConstitutionTest.hash} /></span>
            </div>
            <p className="mt-1.5 pl-6 text-foreground-muted">{t("climax.constitutionNote")}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-5">
          <label htmlFor="loss-amount" className="sr-only">
            {t("climax.lossInputLabel")}
          </label>
          <input
            id="loss-amount"
            type="number"
            min={1}
            value={lossAmount}
            onChange={e => setLossAmount(Number(e.target.value) || 0)}
            disabled={actionsDisabled}
            className="field w-24"
          />
          <span title={readOnlyTooltip}>
            <Button
              variant="danger"
              onClick={() => onMarkDefault(lossAmount)}
              disabled={actionsDisabled}
              loading={busyAction === "mark_default"}
            >
              <AlertTriangle className="size-4" aria-hidden />
              {t("climax.markDefault", { cost: ACTION_COST_ESTIMATES_CSPR.markDefault })}
            </Button>
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

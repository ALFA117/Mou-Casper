"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { UnderwriterCard } from "./UnderwriterCard";
import { useI18n } from "@/lib/i18n/context";
import type { ChainState, RunLogEntry, UnderwriterRunEntry, DefaultChainRunEntry } from "@/lib/types";
import { formatBps, formatDate } from "@/lib/utils";

function latestFor(log: RunLogEntry[], wallet: "underwriter_A" | "underwriter_B", assetId: string): UnderwriterRunEntry | null {
  const matches = log.filter(
    (e): e is UnderwriterRunEntry => e.type === "underwriter" && e.walletName === wallet && e.assetId === assetId
  );
  return matches.length ? matches[matches.length - 1] : null;
}

export function UnderwritingArena({
  assetId,
  chainState,
  runLog,
  busyAction,
  actionsDisabled,
  readOnlyTooltip,
  onRunA,
  onRunB,
}: {
  assetId: string;
  chainState: ChainState | null;
  runLog: RunLogEntry[];
  busyAction: string | null;
  actionsDisabled: boolean;
  readOnlyTooltip?: string;
  onRunA: (stakeCspr: number) => void;
  onRunB: (stakeCspr: number) => void;
}) {
  const { t, locale } = useI18n();
  const [stakeA, setStakeA] = useState(15);
  const [stakeB, setStakeB] = useState(20);

  const runA = useMemo(() => latestFor(runLog, "underwriter_A", assetId), [runLog, assetId]);
  const runB = useMemo(() => latestFor(runLog, "underwriter_B", assetId), [runLog, assetId]);

  // La cadena del servicer siempre rebana al underwriter que sub-cotizo el
  // riesgo (underwriter_B en el guion de esta demo, ver ClimaxPanel) — una
  // vez que ese default ya confirmo para este activo, su tarjeta se apaga.
  const wasSlashedB = useMemo(
    () => runLog.some((e): e is DefaultChainRunEntry => e.type === "default_chain" && e.assetId === assetId),
    [runLog, assetId]
  );

  const bothQuoted = runA?.quote && runB?.quote;
  const disagreementBps = bothQuoted ? Math.abs(runA!.quote.price_bps - runB!.quote.price_bps) : 0;

  // Si las ultimas cotizaciones salieron sin datos de riesgo (x402 sin
  // liquidar), se dice arriba de las tarjetas en vez de dejar que parezcan
  // cotizaciones informadas.
  const latestRuns = [runA, runB].filter((r): r is UnderwriterRunEntry => r !== null);
  const blindRuns = latestRuns.filter(r => typeof r.riskData?.defaultProbabilityBps !== "number");
  const blindDate = blindRuns.length
    ? formatDate(blindRuns.reduce((a, b) => (a.loggedAt > b.loggedAt ? a : b)).loggedAt, locale)
    : null;

  return (
    <section className="" id="underwriting">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[60ch]">
          <p className="kicker lg:hidden">02 · {t("step.underwriters")}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground lg:mt-0">{t("arena.title")}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-muted">{t("arena.description")}</p>
        </div>
        {bothQuoted && (
          <div>
            <p className="label">{t("arena.spreadDiscrepancy").replace(/:$/, "")}</p>
            <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{formatBps(disagreementBps)}</p>
          </div>
        )}
      </div>

      {blindDate && (
        <p className="mb-5 flex gap-2.5 rounded border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground-muted">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brand-glow" aria-hidden />
          <span>{t("arena.noRiskDataNote", { date: blindDate })}</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <UnderwriterCard
          wallet="underwriter_A"
          profile="conservative"
          liveStakeCspr={chainState?.underwriters.underwriter_A.stakeCspr ?? null}
          liveReputation={chainState?.underwriters.underwriter_A.reputation ?? null}
          latestRun={runA}
          wasSlashed={false}
          stakeInputCspr={stakeA}
          onStakeInputChange={setStakeA}
          busy={busyAction === "underwriter_A"}
          disabled={actionsDisabled}
          tooltip={readOnlyTooltip}
          onRun={() => onRunA(stakeA)}
        />
        <UnderwriterCard
          wallet="underwriter_B"
          profile="aggressive"
          liveStakeCspr={chainState?.underwriters.underwriter_B.stakeCspr ?? null}
          liveReputation={chainState?.underwriters.underwriter_B.reputation ?? null}
          latestRun={runB}
          wasSlashed={wasSlashedB}
          stakeInputCspr={stakeB}
          onStakeInputChange={setStakeB}
          busy={busyAction === "underwriter_B"}
          disabled={actionsDisabled}
          tooltip={readOnlyTooltip}
          onRun={() => onRunB(stakeB)}
        />
      </div>
    </section>
  );
}

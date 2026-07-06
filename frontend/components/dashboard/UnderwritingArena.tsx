"use client";

import { useMemo, useState } from "react";
import { UnderwriterCard } from "./UnderwriterCard";
import { useI18n } from "@/lib/i18n/context";
import type { ChainState, RunLogEntry, UnderwriterRunEntry, DefaultChainRunEntry } from "@/lib/types";
import { formatBps } from "@/lib/utils";

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
  const { t } = useI18n();
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

  return (
    <section className="scroll-mt-24" id="underwriting">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{t("arena.title")}</h2>
          <p className="text-xs text-foreground-muted">{t("arena.description")}</p>
        </div>
        {bothQuoted && (
          <div className="rounded-full border border-border bg-surface/90 px-4 py-1.5 text-center text-xs text-foreground-muted shadow-glow">
            {t("arena.spreadDiscrepancy")}{" "}
            <span className="font-mono text-sm font-bold tabular-nums text-foreground">{formatBps(disagreementBps)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UnderwriterCard
          wallet="underwriter_A"
          profile="conservative"
          liveStakeCspr={chainState?.underwriters.underwriter_A.stakeCspr ?? 0}
          liveReputation={chainState?.underwriters.underwriter_A.reputation ?? 0}
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
          liveStakeCspr={chainState?.underwriters.underwriter_B.stakeCspr ?? 0}
          liveReputation={chainState?.underwriters.underwriter_B.reputation ?? 0}
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

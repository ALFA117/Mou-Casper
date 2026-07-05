"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Skull, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TxLink } from "@/components/ui/TxLink";
import type { RunLogEntry, DefaultChainRunEntry, ConstitutionTestRunEntry } from "@/lib/types";
import { ACTION_COST_ESTIMATES_CSPR } from "@/lib/dashboard-config";
import { cn, formatCspr } from "@/lib/utils";

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
  const [lossAmount, setLossAmount] = useState(30);

  const lastDefaultChain = useMemo(() => {
    const matches = runLog.filter((e): e is DefaultChainRunEntry => e.type === "default_chain" && e.assetId === assetId);
    return matches.length ? matches[matches.length - 1] : null;
  }, [runLog, assetId]);

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
      const t = setTimeout(() => setJustFlashed(false), 1100);
      hadResultBefore.current = hasResult;
      return () => clearTimeout(t);
    }
    hadResultBefore.current = hasResult;
  }, [lastDefaultChain]);

  return (
    <Card accent="danger" className="scroll-mt-24 border-danger/20" id="climax">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-danger/10 text-danger-glow">
            <Skull className="size-4" aria-hidden />
          </div>
          <div>
            <CardTitle>El clímax — Default y slashing</CardTitle>
            <p className="text-xs text-foreground-muted">
              mark_default → waterfall → slash sobre el underwriter que sobre-cotizó → penalize/reward en Reputation. Todo real.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={lossAmount}
            onChange={e => setLossAmount(Number(e.target.value) || 0)}
            disabled={actionsDisabled}
            className="h-9 w-24 rounded-lg border border-border-subtle bg-surface-2 px-2 text-xs text-foreground disabled:opacity-50"
            aria-label="Monto de perdida en CSPR"
          />
          <span title={readOnlyTooltip}>
            <Button
              variant="danger"
              onClick={() => onMarkDefault(lossAmount)}
              disabled={actionsDisabled}
              loading={busyAction === "mark_default"}
            >
              <AlertTriangle className="size-4" aria-hidden />
              Marcar impago (~{ACTION_COST_ESTIMATES_CSPR.markDefault} CSPR)
            </Button>
          </span>
        </div>

        {lastDefaultChain ? (
          <div
            className={cn(
              "relative space-y-3 overflow-hidden rounded-xl border border-carbon/50 bg-carbon/10 p-4",
              justFlashed && "animate-slash-flash"
            )}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Skull className="size-4 text-foreground-muted" aria-hidden />
              underwriter_B sobre-cotizó el riesgo — rebanado
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold tabular-nums text-foreground">
                −{(lastDefaultChain.slashBps / 100).toFixed(2)}%
              </span>
              <span className="text-xs text-foreground-faint">de su stake, seizado por el waterfall</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <Badge variant="carbon" className="font-mono">-{lastDefaultChain.penalizePoints} reputación (B)</Badge>
              <Badge variant="brand" className="font-mono">+{lastDefaultChain.rewardPoints} reputación (A)</Badge>
              <Badge variant="neutral" className="font-mono">pérdida marcada: {formatCspr(lastDefaultChain.lossAmountCspr, 0)}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
              <span>mark_default: <TxLink hash={lastDefaultChain.hashes.markDefault} /></span>
              <span>slash: <TxLink hash={lastDefaultChain.hashes.slash} /></span>
              <span>penalize: <TxLink hash={lastDefaultChain.hashes.penalize} /></span>
              <span>reward: <TxLink hash={lastDefaultChain.hashes.reward} /></span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-foreground-faint">
            Corre ambos underwriters para este activo antes de marcar el default (el slash se calcula del spread real que cotizó B).
          </div>
        )}

        {lastConstitutionTest && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border p-3 text-xs",
              lastConstitutionTest.testPassed ? "border-brand/40 bg-brand/10" : "border-danger/40 bg-danger/10"
            )}
          >
            <span className="flex items-center gap-2 text-foreground-muted">
              <ShieldAlert className="size-4 shrink-0" aria-hidden />
              Prueba de Constitution: pedir {formatCspr(lastConstitutionTest.requestedExposureCspr, 0)} de exposición →{" "}
              {lastConstitutionTest.testPassed ? "revirtió como se esperaba" : "NO revirtió (bug)"} ({lastConstitutionTest.errorName})
            </span>
            <TxLink hash={lastConstitutionTest.hash} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

"use client";

import { Activity, Gauge, RefreshCw, CloudOff, Radio } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { Logo } from "@/components/Logo";
import type { ChainState, RunLogEntry } from "@/lib/types";
import { formatCspr } from "@/lib/utils";

export function SiteHeader({
  chainState,
  runLog,
  loading,
  readOnly,
  onRefresh,
}: {
  chainState: ChainState | null;
  runLog: RunLogEntry[];
  loading: boolean;
  readOnly: boolean;
  onRefresh: () => void;
}) {
  const totalStake =
    (chainState?.underwriters.underwriter_A.stakeCspr ?? 0) + (chainState?.underwriters.underwriter_B.stakeCspr ?? 0);
  const avgReputation = chainState
    ? Math.round((chainState.underwriters.underwriter_A.reputation + chainState.underwriters.underwriter_B.reputation) / 2)
    : 0;
  const anySlashed = chainState ? chainState.underwriters.underwriter_B.reputation < 500 : false;
  const onChainEventCount = runLog.length;

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-background/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="size-10 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground">AVAL</h1>
                <Badge variant="brand">Casper Testnet — datos en vivo</Badge>
              </div>
              <p className="text-xs text-foreground-muted">
                Autonomous securitization desk for the agent economy
              </p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden />
            {loading ? "Leyendo cadena…" : "Refrescar"}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatTile
            label="Stake total (en vivo)"
            value={formatCspr(totalStake, 3)}
            countUp={{ value: totalStake, decimals: 3, suffix: " CSPR" }}
            icon={Gauge}
          />
          <StatTile
            label="Reputación promedio"
            value={`${avgReputation}/1000`}
            countUp={{ value: avgReputation, suffix: "/1000" }}
            tone={anySlashed ? "danger" : "brand"}
            icon={Activity}
          />
          <StatTile
            label="Eventos on-chain registrados"
            value={String(onChainEventCount)}
            countUp={{ value: onChainEventCount }}
            icon={Radio}
          />
          <StatTile
            label="Última lectura"
            value={chainState ? new Date(chainState.readAt).toLocaleTimeString() : "—"}
            icon={RefreshCw}
          />
        </div>
      </div>

      {readOnly && (
        <div className="border-t border-border-subtle bg-surface-2/70">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <CloudOff className="size-3.5 shrink-0 text-foreground-faint" aria-hidden />
            <p className="text-[11px] leading-snug text-foreground-muted">
              Vitrina de solo lectura (Vercel) — los números de arriba son reales y en vivo. Corre el proyecto
              localmente para disparar acciones que gastan CSPR.
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

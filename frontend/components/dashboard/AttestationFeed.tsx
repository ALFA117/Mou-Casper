"use client";

import { ShieldCheck, Info, AlertTriangle, Flame, Coins } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { TxLink } from "@/components/ui/TxLink";
import type { RunLogEntry } from "@/lib/types";
import { cn, timeAgo, formatCspr, formatBps } from "@/lib/utils";

interface FeedItem {
  id: string;
  timestamp: number;
  actor: string;
  label: string;
  detail: string;
  hash: string;
  kind: "info" | "success" | "warning" | "danger";
}

function toFeedItems(log: RunLogEntry[]): FeedItem[] {
  const items: FeedItem[] = [];
  log.forEach((entry, i) => {
    const ts = new Date(entry.loggedAt).getTime();
    if (entry.type === "underwriter") {
      if (entry.hashes.x402) {
        items.push({
          id: `${i}-x402`,
          timestamp: ts,
          actor: entry.walletName,
          label: "Pago x402 liquidado",
          detail: `Datos de riesgo para ${entry.assetId}`,
          hash: entry.hashes.x402,
          kind: "info",
        });
      }
      items.push({
        id: `${i}-attest`,
        timestamp: ts,
        actor: entry.walletName,
        label: `Cotización emitida: ${entry.quote.rating}/1000`,
        detail: `${entry.quote.recommended_tranche} tranche · spread ${formatBps(entry.quote.price_bps)}`,
        hash: entry.hashes.attest,
        kind: "success",
      });
      items.push({
        id: `${i}-stake`,
        timestamp: ts,
        actor: entry.walletName,
        label: "Stake depositado",
        detail: `${formatCspr(entry.stakeAmountCspr, 0)} apostados contra su propia cotización`,
        hash: entry.hashes.stake,
        kind: "success",
      });
    } else if (entry.type === "investor_buy") {
      items.push({
        id: `${i}-buy`,
        timestamp: ts,
        actor: "Investor Agent",
        label: `Compró tramo ${entry.entryPoint === "buy_senior" ? "senior" : "junior"}`,
        detail: `${formatCspr(entry.amountCspr, 0)} comprometidos`,
        hash: entry.hash,
        kind: "success",
      });
    } else if (entry.type === "constitution_test") {
      items.push({
        id: `${i}-constitution`,
        timestamp: ts,
        actor: "Constitution",
        label: entry.testPassed ? "Límite de exposición protegido (revirtió)" : "Constitution NO revirtió",
        detail: `Pedido: ${formatCspr(entry.requestedExposureCspr, 0)} · ${entry.errorName}`,
        hash: entry.hash,
        kind: entry.testPassed ? "warning" : "danger",
      });
    } else if (entry.type === "default_chain") {
      items.push({
        id: `${i}-default`,
        timestamp: ts,
        actor: "TrancheVault",
        label: "Default marcado — waterfall ejecutado",
        detail: `Pérdida simulada de ${formatCspr(entry.lossAmountCspr, 0)}`,
        hash: entry.hashes.markDefault,
        kind: "warning",
      });
      items.push({
        id: `${i}-slash`,
        timestamp: ts,
        actor: "UnderwriterStake",
        label: `underwriter_B slasheado (${(entry.slashBps / 100).toFixed(2)}%)`,
        detail: "Sobre-cotizó el riesgo — stake seizado",
        hash: entry.hashes.slash,
        kind: "danger",
      });
      items.push({
        id: `${i}-reputation`,
        timestamp: ts,
        actor: "Reputation",
        label: "Reputación actualizada",
        detail: `B −${entry.penalizePoints} · A +${entry.rewardPoints}`,
        hash: entry.hashes.reward,
        kind: "danger",
      });
    }
  });
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

const KIND_ICON: Record<FeedItem["kind"], typeof Info> = {
  info: Info,
  success: ShieldCheck,
  warning: AlertTriangle,
  danger: Flame,
};

const KIND_COLOR: Record<FeedItem["kind"], string> = {
  info: "text-senior-glow bg-senior/10",
  success: "text-brand-glow bg-brand/10",
  warning: "text-junior-glow bg-junior/10",
  danger: "text-danger-glow bg-danger/10",
};

export function AttestationFeed({ runLog }: { runLog: RunLogEntry[] }) {
  const entries = toFeedItems(runLog);

  return (
    <Card className="flex h-full flex-col" id="attestations">
      <CardHeader>
        <div>
          <CardTitle>Feed de atestaciones on-chain</CardTitle>
          <p className="text-xs text-foreground-muted">
            <Coins className="mr-1 inline size-3" aria-hidden />
            Reconstruido de agents/run-log.json — cada entrada es una transacción real confirmada en CSPR.live.
          </p>
        </div>
      </CardHeader>
      <CardBody className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-xs text-foreground-faint">
            Sin actividad on-chain todavía.
          </div>
        ) : (
          <ol className="space-y-2.5">
            {entries.map(entry => {
              const Icon = KIND_ICON[entry.kind];
              return (
                <li key={entry.id} className="rounded-lg border border-border-subtle bg-surface-2/60 p-3">
                  <div className="flex items-start gap-2">
                    <div className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md", KIND_COLOR[entry.kind])}>
                      <Icon className="size-3.5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-foreground">{entry.label}</span>
                        <span className="shrink-0 text-[10px] text-foreground-faint">{timeAgo(entry.timestamp)}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-foreground-muted">{entry.detail}</p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-foreground-faint">{entry.actor}</span>
                        <TxLink hash={entry.hash} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

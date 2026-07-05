"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, Stamp, Lock, Layers, ShieldAlert, AlertTriangle, Skull, Activity, Coins, type LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { TxLink } from "@/components/ui/TxLink";
import type { RunLogEntry } from "@/lib/types";
import { cn, timeAgo, formatCspr, formatBps } from "@/lib/utils";

type FeedTone = "senior" | "junior" | "brand" | "danger" | "carbon";

interface FeedItem {
  id: string;
  timestamp: number;
  actor: string;
  label: string;
  detail: string;
  hash: string;
  icon: LucideIcon;
  tone: FeedTone;
}

function toFeedItems(log: RunLogEntry[]): FeedItem[] {
  const items: FeedItem[] = [];
  log.forEach((entry, i) => {
    const ts = new Date(entry.loggedAt).getTime();
    if (entry.type === "underwriter") {
      // Blanco/cromo para el conservador (A), rojo ember para el agresivo (B)
      // -- el mismo lenguaje de color que sus tarjetas, para escanear el feed
      // de un vistazo y saber quien hizo que.
      const tone: FeedTone = entry.walletName === "underwriter_A" ? "senior" : "junior";
      if (entry.hashes.x402) {
        items.push({
          id: `${i}-x402`,
          timestamp: ts,
          actor: entry.walletName,
          label: "Pago x402 liquidado",
          detail: `Datos de riesgo para ${entry.assetId}`,
          hash: entry.hashes.x402,
          icon: Zap,
          tone,
        });
      }
      items.push({
        id: `${i}-attest`,
        timestamp: ts,
        actor: entry.walletName,
        label: `Cotización emitida: ${entry.quote.rating}/1000`,
        detail: `${entry.quote.recommended_tranche} tranche · spread ${formatBps(entry.quote.price_bps)}`,
        hash: entry.hashes.attest,
        icon: Stamp,
        tone,
      });
      items.push({
        id: `${i}-stake`,
        timestamp: ts,
        actor: entry.walletName,
        label: "Stake depositado",
        detail: `${formatCspr(entry.stakeAmountCspr, 0)} apostados contra su propia cotización`,
        hash: entry.hashes.stake,
        icon: Lock,
        tone,
      });
    } else if (entry.type === "investor_buy") {
      const tone: FeedTone = entry.entryPoint === "buy_senior" ? "senior" : "junior";
      items.push({
        id: `${i}-buy`,
        timestamp: ts,
        actor: "Investor Agent",
        label: `Compró tramo ${entry.entryPoint === "buy_senior" ? "senior" : "junior"}`,
        detail: `${formatCspr(entry.amountCspr, 0)} comprometidos`,
        hash: entry.hash,
        icon: Layers,
        tone,
      });
    } else if (entry.type === "constitution_test") {
      items.push({
        id: `${i}-constitution`,
        timestamp: ts,
        actor: "Constitution",
        label: entry.testPassed ? "Límite de exposición protegido (revirtió)" : "Constitution NO revirtió",
        detail: `Pedido: ${formatCspr(entry.requestedExposureCspr, 0)} · ${entry.errorName}`,
        hash: entry.hash,
        icon: ShieldAlert,
        tone: "danger",
      });
    } else if (entry.type === "default_chain") {
      items.push({
        id: `${i}-default`,
        timestamp: ts,
        actor: "TrancheVault",
        label: "Default marcado — waterfall ejecutado",
        detail: `Pérdida simulada de ${formatCspr(entry.lossAmountCspr, 0)}`,
        hash: entry.hashes.markDefault,
        icon: AlertTriangle,
        tone: "danger",
      });
      items.push({
        id: `${i}-slash`,
        timestamp: ts,
        actor: "UnderwriterStake",
        label: `underwriter_B slasheado (${(entry.slashBps / 100).toFixed(2)}%)`,
        detail: "Sobre-cotizó el riesgo — stake seizado",
        hash: entry.hashes.slash,
        icon: Skull,
        tone: "carbon",
      });
      items.push({
        id: `${i}-reputation`,
        timestamp: ts,
        actor: "Reputation",
        label: "Reputación actualizada",
        detail: `B −${entry.penalizePoints} · A +${entry.rewardPoints}`,
        hash: entry.hashes.reward,
        icon: Activity,
        tone: "brand",
      });
    }
  });
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

const TONE_COLOR: Record<FeedTone, string> = {
  senior: "text-senior-glow bg-senior/10",
  junior: "text-junior-glow bg-junior/10",
  brand: "text-brand-glow bg-brand/10",
  danger: "text-danger-glow bg-danger/10",
  carbon: "text-foreground-muted bg-carbon/15",
};

function FeedEntryRow({ entry, isNew, staggerIndex }: { entry: FeedItem; isNew: boolean; staggerIndex: number }) {
  const [entered, setEntered] = useState(!isNew);
  useEffect(() => {
    if (isNew) {
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Icon = entry.icon;
  return (
    <li
      className={cn(
        "rounded-lg border border-border-subtle bg-surface-2/60 p-3 transition-all duration-300 ease-out",
        "motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
        entered ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
      )}
      style={isNew ? { transitionDelay: `${staggerIndex * 40}ms` } : undefined}
    >
      <div className="flex items-start gap-2">
        <div className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md", TONE_COLOR[entry.tone])}>
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
}

export function AttestationFeed({ runLog }: { runLog: RunLogEntry[] }) {
  const entries = toFeedItems(runLog);

  // Cada entrada recuerda si ya se vio antes (Set persistente entre renders).
  // Las nunca-vistas entran con slide-in escalonado; el resto no re-anima en
  // cada refresco de polling. Se calcula en el render (no en un efecto) para
  // que el primer montaje del item ya sepa si es nuevo o no.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  let newIndex = -1;

  useEffect(() => {
    entries.forEach(e => seenIdsRef.current.add(e.id));
    isFirstLoadRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runLog]);

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
              // Nunca animar la carga inicial (evita una cascada de toda la
              // historia al entrar a la pagina) — solo lo que llega despues.
              const isNew = !isFirstLoadRef.current && !seenIdsRef.current.has(entry.id);
              if (isNew) newIndex++;
              return <FeedEntryRow key={entry.id} entry={entry} isNew={isNew} staggerIndex={newIndex} />;
            })}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { Zap, Stamp, Lock, Layers, ShieldAlert, AlertTriangle, Skull, Activity, type LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { TxLink } from "@/components/ui/TxLink";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { RunLogEntry } from "@/lib/types";
import { cn, timeAgo, formatCspr, formatBps } from "@/lib/utils";

type FeedTone = "senior" | "junior" | "brand" | "danger" | "carbon";
type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

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

function toFeedItems(log: RunLogEntry[], t: Translate): FeedItem[] {
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
          label: t("feed.x402Settled"),
          detail: t("feed.x402Detail", { assetId: entry.assetId }),
          hash: entry.hashes.x402,
          icon: Zap,
          tone,
        });
      }
      items.push({
        id: `${i}-attest`,
        timestamp: ts,
        actor: entry.walletName,
        label: t("feed.quoteIssued", { rating: entry.quote.rating }),
        detail: t("feed.quoteDetail", { tranche: entry.quote.recommended_tranche, spread: formatBps(entry.quote.price_bps) }),
        hash: entry.hashes.attest,
        icon: Stamp,
        tone,
      });
      items.push({
        id: `${i}-stake`,
        timestamp: ts,
        actor: entry.walletName,
        label: t("feed.stakeDeposited"),
        detail: t("feed.stakeDetail", { amount: formatCspr(entry.stakeAmountCspr, 0) }),
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
        label: t("feed.boughtTranche", { tranche: entry.entryPoint === "buy_senior" ? "senior" : "junior" }),
        detail: t("feed.boughtDetail", { amount: formatCspr(entry.amountCspr, 0) }),
        hash: entry.hash,
        icon: Layers,
        tone,
      });
    } else if (entry.type === "constitution_test") {
      items.push({
        id: `${i}-constitution`,
        timestamp: ts,
        actor: "Constitution",
        label: t(entry.testPassed ? "feed.exposureProtected" : "feed.exposureNotReverted"),
        detail: t("feed.exposureDetail", { amount: formatCspr(entry.requestedExposureCspr, 0), error: entry.errorName }),
        hash: entry.hash,
        icon: ShieldAlert,
        tone: "danger",
      });
    } else if (entry.type === "default_chain") {
      items.push({
        id: `${i}-default`,
        timestamp: ts,
        actor: "TrancheVault",
        label: t("feed.defaultMarked"),
        detail: t("feed.defaultDetail", { amount: formatCspr(entry.lossAmountCspr, 0) }),
        hash: entry.hashes.markDefault,
        icon: AlertTriangle,
        tone: "danger",
      });
      items.push({
        id: `${i}-slash`,
        timestamp: ts,
        actor: "UnderwriterStake",
        label: t("feed.slashed", { pct: (entry.slashBps / 100).toFixed(2) }),
        detail: t("feed.slashedDetail"),
        hash: entry.hashes.slash,
        icon: Skull,
        tone: "carbon",
      });
      items.push({
        id: `${i}-reputation`,
        timestamp: ts,
        actor: "Reputation",
        label: t("feed.reputationUpdated"),
        detail: t("feed.reputationDetail", { penalize: entry.penalizePoints, reward: entry.rewardPoints }),
        hash: entry.hashes.reward,
        icon: Activity,
        tone: "brand",
      });
    }
  });
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

const TONE_COLOR: Record<FeedTone, string> = {
  senior: "border-senior/30 bg-senior-dim text-senior-glow",
  junior: "border-brand/30 bg-brand-dim text-brand-glow",
  brand: "border-border bg-surface-2 text-foreground-muted",
  danger: "border-brand/30 bg-brand-dim text-brand-glow",
  carbon: "border-border bg-surface-3 text-foreground-muted",
};

function FeedEntryRow({
  entry,
  isNew,
  staggerIndex,
  locale,
}: {
  entry: FeedItem;
  isNew: boolean;
  staggerIndex: number;
  locale: string;
}) {
  const Icon = entry.icon;
  return (
    <li
      className={cn("flex gap-3 px-5 py-3.5", isNew && "animate-rise")}
      style={isNew ? { animationDelay: `${staggerIndex * 40}ms` } : undefined}
    >
      <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded border", TONE_COLOR[entry.tone])}>
        <Icon className="size-3.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{entry.label}</span>
          <time className="shrink-0 text-xs text-foreground-faint" dateTime={new Date(entry.timestamp).toISOString()}>
            {timeAgo(entry.timestamp, locale)}
          </time>
        </div>
        <p className="text-[13px] leading-snug text-foreground-muted">{entry.detail}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2">
          <span className="font-mono text-xs text-foreground-faint">{entry.actor}</span>
          <TxLink hash={entry.hash} />
        </div>
      </div>
    </li>
  );
}

export function AttestationFeed({
  runLog,
  status,
}: {
  runLog: RunLogEntry[];
  status: "loading" | "ready" | "error";
}) {
  const { t, locale } = useI18n();
  const entries = toFeedItems(runLog, t);

  // Cada entrada recuerda si ya se vio antes (Set persistente entre renders).
  // Las nunca-vistas entran con slide-in escalonado; el resto no re-anima en
  // cada refresco de polling. Se calcula en el render (no en un efecto) para
  // que el primer montaje del item ya sepa si es nuevo o no.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  let newIndex = -1;

  useEffect(() => {
    entries.forEach(e => seenIdsRef.current.add(e.id));
    // La "carga inicial" termina cuando llega el primer registro, no en el
    // primer render (que siempre es []): si no, toda la historia entraba como
    // "nueva" con un retraso escalonado de varios segundos.
    if (status !== "loading") isFirstLoadRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runLog, status]);

  return (
    <Card className="flex h-full flex-col" id="attestations">
      <CardHeader className="block">
        <CardTitle>{t("feed.title")}</CardTitle>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground-muted">{t("feed.description")}</p>
      </CardHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {status === "loading" && entries.length === 0 ? (
          <div role="status" aria-live="polite" className="space-y-3 p-5">
            <p className="text-sm text-foreground-muted">{t("feed.loading")}</p>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} aria-hidden className="flex gap-3">
                <div className="size-7 shrink-0 animate-pulse rounded bg-surface-3 motion-reduce:animate-none" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none" />
                  <div className="h-3 w-1/2 animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        ) : status === "error" && entries.length === 0 ? (
          <div role="alert" className="m-5 rounded border border-brand/40 bg-brand-dim px-4 py-4 text-sm text-foreground">
            {t("feed.error")}
          </div>
        ) : entries.length === 0 ? (
          <div className="m-5 rounded border border-dashed border-border px-4 py-8 text-center text-sm text-foreground-muted">
            {t("feed.empty")}
          </div>
        ) : (
          <ol className="divide-y divide-border-subtle">
            {entries.map(entry => {
              // Nunca animar la carga inicial (evita una cascada de toda la
              // historia al entrar a la pagina) — solo lo que llega despues.
              const isNew = !isFirstLoadRef.current && !seenIdsRef.current.has(entry.id);
              if (isNew) newIndex++;
              return <FeedEntryRow key={entry.id} entry={entry} isNew={isNew} staggerIndex={newIndex} locale={locale} />;
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}

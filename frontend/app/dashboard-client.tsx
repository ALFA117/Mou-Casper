"use client";

import { useMemo } from "react";
import { SiteHeader } from "@/components/dashboard/SiteHeader";
import { Hero } from "@/components/dashboard/Hero";
import { UnderwritingArena } from "@/components/dashboard/UnderwritingArena";
import { TrancheVaultPanel } from "@/components/dashboard/TrancheVaultPanel";
import { ClimaxPanel } from "@/components/dashboard/ClimaxPanel";
import { AttestationFeed } from "@/components/dashboard/AttestationFeed";
import { BusyStatusBar } from "@/components/dashboard/BusyStatusBar";
import { RunItYourself } from "@/components/dashboard/RunItYourself";
import { GuideHint } from "@/components/dashboard/GuideHint";
import { TxLink } from "@/components/ui/TxLink";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DemoStep } from "@/components/ui/DemoStep";
import { RevealOnMount } from "@/components/ui/RevealOnMount";
import { useAvalDashboard } from "@/lib/use-aval-dashboard";
import { ACTION_COST_ESTIMATES_CSPR } from "@/lib/dashboard-config";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { AlertTriangle, PlayCircle } from "lucide-react";

export function DashboardClient({ readOnly }: { readOnly: boolean }) {
  return (
    <I18nProvider>
      <DashboardContent readOnly={readOnly} />
    </I18nProvider>
  );
}

function DashboardContent({ readOnly }: { readOnly: boolean }) {
  const { t } = useI18n();
  const {
    assetId,
    setAssetId,
    chainState,
    runLog,
    runLogStatus,
    loadingChainState,
    chainStateError,
    busyAction,
    busyActionStartedAt,
    lastActionLog,
    demoBudget,
    actions,
  } = useAvalDashboard({ readOnly });

  const readOnlyTooltip = readOnly ? t("readOnly.tooltip") : undefined;

  // Vercel no puede: firmar deploys (las llaves viven en /keys, no se suben),
  // correr el facilitator x402 (necesita localhost:4021/4022), ni hacer spawn
  // de los scripts de /agents. Los botones se deshabilitan aqui en vez de
  // dejarlos fallar con un error confuso.
  const actionsDisabled = readOnly || busyAction !== null;

  // El demo:run completo esta bloqueado server-side cuando se llega por el
  // tunel publico (ver lib/server/demo-guard.ts) -- el boton debe verse
  // deshabilitado con su motivo ANTES de que el visitante haga click y
  // reciba un fallo, no despues.
  const demoRunBlockedPublic = demoBudget ? !demoBudget.demoRunEnabled : false;
  const demoRunDisabled = actionsDisabled || demoRunBlockedPublic;
  // readOnly (Vercel) es la razon mas fundamental -- si aplica, su tooltip
  // gana sobre el del bloqueo por tunel aunque demoBudget tambien diga
  // bloqueado (Vercel tambien resuelve isPublic=true por su propio Host).
  const demoRunTooltip = readOnly ? readOnlyTooltip : demoRunBlockedPublic ? t("step1.disabledPublicTooltip") : undefined;

  // Modo guia: el siguiente paso no completado del arco para ESTE assetId,
  // para que un visitante que llega por el tunel sin contexto sepa por donde
  // empezar. Desaparece solo cuando ese paso ya corrio, no hay que cerrarlo.
  const suggestedStep = useMemo<"02" | "03" | "04" | null>(() => {
    if (readOnly) return null;
    const bothUnderwritersRun = (["underwriter_A", "underwriter_B"] as const).every(wallet =>
      runLog.some(e => e.type === "underwriter" && e.assetId === assetId && e.walletName === wallet)
    );
    if (!bothUnderwritersRun) return "02";
    if (!runLog.some(e => e.type === "investor_buy")) return "03";
    if (!runLog.some(e => e.type === "default_chain" && e.assetId === assetId)) return "04";
    return null;
  }, [runLog, assetId, readOnly]);

  const guideHintText =
    suggestedStep === "02"
      ? t("guide.hint.underwriters")
      : suggestedStep === "03"
        ? t("guide.hint.vault")
        : suggestedStep === "04"
          ? t("guide.hint.climax")
          : null;
  const guideHintTarget =
    suggestedStep === "02" ? "underwriting" : suggestedStep === "03" ? "vault" : suggestedStep === "04" ? "climax" : null;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded border border-border-strong bg-surface px-4 py-2 text-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t("nav.skip")}
      </a>
      <SiteHeader loading={loadingChainState} readOnly={readOnly} demoBudget={demoBudget} onRefresh={actions.refresh} />

      <main id="main">
        <Hero
          chainState={chainState}
          runLog={runLog}
          runLogReady={runLogStatus === "ready"}
          loading={loadingChainState}
          readOnly={readOnly}
        />

        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
            <div className="min-w-0 space-y-10">
              {guideHintText && guideHintTarget && !actionsDisabled && (
                <RevealOnMount index={0}>
                  <GuideHint text={guideHintText} targetId={guideHintTarget} />
                </RevealOnMount>
              )}

              {chainStateError && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex gap-2.5 rounded border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground-muted"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brand-glow" aria-hidden />
                  {t(chainStateError)}
                </div>
              )}

              <RevealOnMount index={1}>
                <DemoStep n="01" tone="senior" targetId="asset">
                  <Card className="" id="asset">
                    <CardHeader>
                      <div className="max-w-[62ch]">
                        <p className="kicker lg:hidden">01 · {t("step.asset")}</p>
                        <CardTitle className="text-xl">{t("step1.title")}</CardTitle>
                        <p className="mt-1 text-[15px] leading-relaxed text-foreground-muted">{t("step1.description")}</p>
                      </div>
                    </CardHeader>
                    <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <label htmlFor="asset-id" className="label mb-1.5 block">
                          {t("step1.assetIdLabel")}
                        </label>
                        <input
                          id="asset-id"
                          type="text"
                          value={assetId}
                          onChange={e => setAssetId(e.target.value)}
                          disabled={readOnly}
                          className="field w-full"
                        />
                      </div>
                      <span title={demoRunTooltip} className="sm:shrink-0">
                        <Button
                          onClick={() =>
                            actions.runFullDemo({
                              aStakeCspr: 15,
                              bStakeCspr: 20,
                              investorSeniorCspr: 15,
                              investorJuniorCspr: 10,
                              lossAmountCspr: 30,
                            })
                          }
                          disabled={demoRunDisabled}
                          loading={busyAction === "demo_run"}
                          className="w-full sm:w-auto"
                        >
                          <PlayCircle className="size-4" aria-hidden />
                          {t("step1.runFullDemo", { cost: ACTION_COST_ESTIMATES_CSPR.fullDemoRun })}
                        </Button>
                      </span>
                    </CardBody>
                  </Card>
                </DemoStep>
              </RevealOnMount>

              <RevealOnMount index={2}>
                <DemoStep n="02" tone="senior" targetId="underwriting" suggested={suggestedStep === "02"}>
                  <UnderwritingArena
                    assetId={assetId}
                    chainState={chainState}
                    runLog={runLog}
                    busyAction={busyAction}
                    actionsDisabled={actionsDisabled}
                    readOnlyTooltip={readOnlyTooltip}
                    onRunA={actions.runUnderwriterA}
                    onRunB={actions.runUnderwriterB}
                  />
                </DemoStep>
              </RevealOnMount>

              <RevealOnMount index={3}>
                <DemoStep n="03" tone="brand" targetId="vault" suggested={suggestedStep === "03"}>
                  <TrancheVaultPanel
                    chainState={chainState}
                    runLog={runLog}
                    busyAction={busyAction}
                    actionsDisabled={actionsDisabled}
                    readOnlyTooltip={readOnlyTooltip}
                    onBuySenior={actions.buySenior}
                    onBuyJunior={actions.buyJunior}
                  />
                </DemoStep>
              </RevealOnMount>

              <RevealOnMount index={4}>
                <DemoStep n="04" tone="danger" targetId="climax" last suggested={suggestedStep === "04"}>
                  <ClimaxPanel
                    assetId={assetId}
                    runLog={runLog}
                    busyAction={busyAction}
                    actionsDisabled={actionsDisabled}
                    readOnlyTooltip={readOnlyTooltip}
                    onMarkDefault={actions.markDefault}
                  />
                </DemoStep>
              </RevealOnMount>
            </div>

            <aside className="min-w-0 xl:sticky xl:top-24 xl:h-[calc(100dvh-7rem)]">
              <AttestationFeed runLog={runLog} status={runLogStatus} />
            </aside>
          </div>

          <div className="mt-14">
            <RunItYourself />
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold tracking-[0.04em] text-foreground">AVAL</span>
            <span className="text-sm text-foreground-faint">{t("header.tagline")}</span>
          </div>
          <p className="max-w-[72ch] text-[13px] leading-relaxed text-foreground-muted">{t("footer.disclaimer")}</p>
        </div>
      </footer>

      {busyAction && busyActionStartedAt && <BusyStatusBar actionKey={busyAction} startedAt={busyActionStartedAt} />}

      {lastActionLog.length > 0 && (
        <div className="pointer-events-none fixed right-4 top-20 z-40 hidden w-80 space-y-2 lg:block" aria-live="polite">
          {lastActionLog.slice(0, 4).map((entry, i) => (
            <div
              key={i}
              className={`pointer-events-auto rounded border bg-surface px-3.5 py-2.5 text-[13px] shadow-hard-sm ${
                entry.ok ? "border-border-strong text-foreground" : "border-brand text-brand-glow"
              }`}
            >
              <div className="font-medium">{entry.label}</div>
              <div className="text-foreground-muted">{entry.detail}</div>
              {entry.hash && (
                <div className="mt-1">
                  <TxLink hash={entry.hash} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

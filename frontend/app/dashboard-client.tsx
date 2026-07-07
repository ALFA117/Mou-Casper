"use client";

import { useMemo } from "react";
import { Background3D } from "@/components/Background3D";
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
import { PlayCircle } from "lucide-react";

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
    loadingChainState,
    chainStateError,
    busyAction,
    busyActionStartedAt,
    lastActionLog,
    bgEvent,
    demoBudget,
    actions,
  } = useAvalDashboard();

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
      <Background3D event={bgEvent} />
      <div className="relative z-10 min-h-dvh">
        <SiteHeader
          chainState={chainState}
          runLog={runLog}
          loading={loadingChainState}
          readOnly={readOnly}
          demoBudget={demoBudget}
          onRefresh={actions.refresh}
        />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <RevealOnMount index={0}>
                <Hero />
              </RevealOnMount>

              {guideHintText && guideHintTarget && !actionsDisabled && (
                <RevealOnMount index={0}>
                  <GuideHint text={guideHintText} targetId={guideHintTarget} />
                </RevealOnMount>
              )}

              {chainStateError && (
                <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger-glow">
                  {t("error.chainStateRead", { error: chainStateError })}
                </div>
              )}

              <RevealOnMount index={1}>
                <DemoStep n="01" tone="senior" targetId="asset">
                  <Card accent="senior" className="scroll-mt-24" id="asset">
                    <CardHeader>
                      <div>
                        <CardTitle>{t("step1.title")}</CardTitle>
                        <p className="text-xs text-foreground-muted">{t("step1.description")}</p>
                      </div>
                    </CardHeader>
                    <CardBody className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        value={assetId}
                        onChange={e => setAssetId(e.target.value)}
                        disabled={readOnly}
                        className="h-10 flex-1 min-w-[200px] rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-foreground disabled:opacity-50"
                        aria-label={t("step1.assetIdLabel")}
                      />
                      <span title={demoRunTooltip}>
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

              <RevealOnMount index={5}>
                <RunItYourself />
              </RevealOnMount>

              <footer className="pb-8 pt-2 text-center text-xs text-foreground-faint">{t("footer.disclaimer")}</footer>
            </div>

            <RevealOnMount index={1} className="xl:sticky xl:top-20 xl:h-[calc(100dvh-5rem)]">
              <AttestationFeed runLog={runLog} />
            </RevealOnMount>
          </div>
        </main>

        {busyAction && busyActionStartedAt && <BusyStatusBar actionKey={busyAction} startedAt={busyActionStartedAt} />}

        {lastActionLog.length > 0 && (
          <div className="pointer-events-none fixed right-4 top-24 z-40 hidden w-72 space-y-1.5 lg:block">
            {lastActionLog.slice(0, 4).map((entry, i) => (
              <div
                key={i}
                className={`pointer-events-auto rounded-lg border px-3 py-2 text-xs shadow-glow backdrop-blur-md ${
                  entry.ok ? "border-brand/40 bg-surface/95 text-foreground" : "border-danger/40 bg-surface/95 text-danger-glow"
                }`}
              >
                <div className="font-medium">{entry.label}</div>
                <div className="text-foreground-faint">{entry.detail}</div>
                {entry.hash && (
                  <div className="mt-1">
                    <TxLink hash={entry.hash} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

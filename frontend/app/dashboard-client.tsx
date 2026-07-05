"use client";

import { Background3D } from "@/components/Background3D";
import { SiteHeader } from "@/components/dashboard/SiteHeader";
import { UnderwritingArena } from "@/components/dashboard/UnderwritingArena";
import { TrancheVaultPanel } from "@/components/dashboard/TrancheVaultPanel";
import { ClimaxPanel } from "@/components/dashboard/ClimaxPanel";
import { AttestationFeed } from "@/components/dashboard/AttestationFeed";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAvalDashboard } from "@/lib/use-aval-dashboard";
import { ACTION_COST_ESTIMATES_CSPR } from "@/lib/dashboard-config";
import { Loader2, PlayCircle, CloudOff } from "lucide-react";

const READONLY_TOOLTIP = "Corre localmente para acciones — este deploy en Vercel es solo lectura (no puede firmar transacciones ni correr agentes).";

export function DashboardClient({ readOnly }: { readOnly: boolean }) {
  const { assetId, setAssetId, chainState, runLog, loadingChainState, chainStateError, busyAction, lastActionLog, actions } =
    useAvalDashboard();

  // Vercel no puede: firmar deploys (las llaves viven en /keys, no se suben),
  // correr el facilitator x402 (necesita localhost:4021/4022), ni hacer spawn
  // de los scripts de /agents. Los botones se deshabilitan aqui en vez de
  // dejarlos fallar con un error confuso.
  const actionsDisabled = readOnly || busyAction !== null;

  return (
    <>
      <Background3D />
      <div className="relative z-10 min-h-dvh">
        <SiteHeader chainState={chainState} runLog={runLog} loading={loadingChainState} onRefresh={actions.refresh} />

        {readOnly && (
          <div className="mx-auto mt-4 flex max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
            <Badge variant="neutral" className="w-full justify-center gap-1.5 py-2 text-[11px]">
              <CloudOff className="size-3.5" aria-hidden />
              Vitrina de solo lectura (Vercel) — los números de arriba son reales y en vivo. Corre el proyecto
              localmente para disparar acciones que gastan CSPR.
            </Badge>
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              {chainStateError && (
                <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger-glow">
                  No se pudo leer el estado on-chain: {chainStateError}
                </div>
              )}

              <Card accent="senior" id="asset">
                <CardHeader>
                  <div>
                    <CardTitle>Activo en demo</CardTitle>
                    <p className="text-xs text-foreground-muted">
                      Los datos de riesgo reales se compran vía x402 a /x402-service para este ID.
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={assetId}
                    onChange={e => setAssetId(e.target.value)}
                    disabled={readOnly}
                    className="h-10 flex-1 min-w-[200px] rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-foreground disabled:opacity-50"
                    aria-label="Asset ID"
                  />
                  <span title={readOnly ? READONLY_TOOLTIP : undefined}>
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
                      disabled={actionsDisabled}
                      loading={busyAction === "demo_run"}
                    >
                      <PlayCircle className="size-4" aria-hidden />
                      Correr demo:run completo (~{ACTION_COST_ESTIMATES_CSPR.fullDemoRun} CSPR, varios minutos)
                    </Button>
                  </span>
                </CardBody>
              </Card>

              <UnderwritingArena
                assetId={assetId}
                chainState={chainState}
                runLog={runLog}
                busyAction={busyAction}
                actionsDisabled={actionsDisabled}
                readOnlyTooltip={readOnly ? READONLY_TOOLTIP : undefined}
                onRunA={actions.runUnderwriterA}
                onRunB={actions.runUnderwriterB}
              />

              <TrancheVaultPanel
                chainState={chainState}
                runLog={runLog}
                busyAction={busyAction}
                actionsDisabled={actionsDisabled}
                readOnlyTooltip={readOnly ? READONLY_TOOLTIP : undefined}
                onBuySenior={actions.buySenior}
                onBuyJunior={actions.buyJunior}
              />

              <ClimaxPanel
                assetId={assetId}
                runLog={runLog}
                busyAction={busyAction}
                actionsDisabled={actionsDisabled}
                readOnlyTooltip={readOnly ? READONLY_TOOLTIP : undefined}
                onMarkDefault={actions.markDefault}
              />

              <footer className="pb-8 pt-2 text-center text-xs text-foreground-faint">
                Todas las cifras son leídas en vivo de Casper Testnet o de agents/run-log.json (transacciones reales ya
                confirmadas) — nada en esta página está simulado ni calculado localmente sin respaldo on-chain.
              </footer>
            </div>

            <div className="lg:sticky lg:top-24 lg:h-[calc(100dvh-7rem)]">
              <AttestationFeed runLog={runLog} />
            </div>
          </div>
        </main>

        {busyAction && (
          <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface/95 px-4 py-2 text-xs font-medium text-foreground shadow-glow backdrop-blur-md">
              <Loader2 className="size-3.5 animate-spin text-senior-glow" aria-hidden />
              Ejecutando acción real en Casper Testnet ({busyAction})… esto puede tardar varios minutos.
            </div>
          </div>
        )}

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
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

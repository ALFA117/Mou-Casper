"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChainState, RunLogEntry, ProfileKey } from "./types";
import { fetchChainState, fetchRunLog, runUnderwriter, investInTranche, markDefault, runFullDemo } from "./real-data";
import { DEFAULT_ASSET_ID } from "./dashboard-config";

export interface AvalDashboardState {
  assetId: string;
  chainState: ChainState | null;
  runLog: RunLogEntry[];
  loadingChainState: boolean;
  chainStateError: string | null;
  busyAction: string | null; // qué botón está corriendo ahora mismo, o null
  lastActionLog: { label: string; ok: boolean; detail: string }[];
}

export function useAvalDashboard() {
  const [assetId, setAssetId] = useState(DEFAULT_ASSET_ID);
  const [chainState, setChainState] = useState<ChainState | null>(null);
  const [runLog, setRunLog] = useState<RunLogEntry[]>([]);
  const [loadingChainState, setLoadingChainState] = useState(true);
  const [chainStateError, setChainStateError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [lastActionLog, setLastActionLog] = useState<{ label: string; ok: boolean; detail: string }[]>([]);

  const refresh = useCallback(async () => {
    setLoadingChainState(true);
    try {
      const [state, log] = await Promise.all([fetchChainState(), fetchRunLog()]);
      setChainState(state);
      setRunLog(log);
      setChainStateError(null);
    } catch (err) {
      setChainStateError(err instanceof Error ? err.message : "Error leyendo estado on-chain");
    } finally {
      setLoadingChainState(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pushLog = useCallback((label: string, ok: boolean, detail: string) => {
    setLastActionLog(prev => [{ label, ok, detail }, ...prev].slice(0, 20));
  }, []);

  const runAction = useCallback(
    async (key: string, label: string, fn: () => Promise<{ exitCode: number; stdout: string }>) => {
      if (busyAction) return;
      setBusyAction(key);
      try {
        const result = await fn();
        pushLog(label, result.exitCode === 0, result.exitCode === 0 ? "SUCCESS" : "Revisa la consola / stdout");
      } catch (err) {
        pushLog(label, false, err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setBusyAction(null);
        await refresh();
      }
    },
    [busyAction, pushLog, refresh]
  );

  const actions = {
    runUnderwriterA: (stakeCspr: number) =>
      runAction("underwriter_A", "Underwriter A corrió su loop", () =>
        runUnderwriter({ wallet: "underwriter_A", assetId, stakeCspr, profile: "conservative" as ProfileKey })
      ),
    runUnderwriterB: (stakeCspr: number) =>
      runAction("underwriter_B", "Underwriter B corrió su loop", () =>
        runUnderwriter({ wallet: "underwriter_B", assetId, stakeCspr, profile: "aggressive" as ProfileKey })
      ),
    buySenior: (amountCspr: number) =>
      runAction("buy_senior", "Investor compró tramo senior", () => investInTranche({ entryPoint: "buy_senior", amountCspr })),
    buyJunior: (amountCspr: number) =>
      runAction("buy_junior", "Investor compró tramo junior", () => investInTranche({ entryPoint: "buy_junior", amountCspr })),
    markDefault: (lossAmountCspr: number) =>
      runAction("mark_default", "Cadena del servicer ejecutada", () => markDefault({ assetId, lossAmountCspr })),
    runFullDemo: (params: { aStakeCspr: number; bStakeCspr: number; investorSeniorCspr: number; investorJuniorCspr: number; lossAmountCspr: number }) =>
      runAction("demo_run", "demo:run completo", () => runFullDemo({ assetId, ...params })),
    refresh,
  };

  return { assetId, setAssetId, chainState, runLog, loadingChainState, chainStateError, busyAction, lastActionLog, actions };
}

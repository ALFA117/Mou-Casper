"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChainState, RunLogEntry, ProfileKey, BackgroundEvent, DemoBudget } from "./types";
import {
  fetchChainState,
  fetchRunLog,
  fetchDemoBudget,
  runUnderwriter,
  investInTranche,
  markDefault,
  runFullDemo,
} from "./real-data";
import { DEFAULT_ASSET_ID } from "./dashboard-config";
import { useI18n } from "./i18n/context";

export interface AvalDashboardState {
  assetId: string;
  chainState: ChainState | null;
  runLog: RunLogEntry[];
  loadingChainState: boolean;
  chainStateError: string | null;
  busyAction: string | null; // qué botón está corriendo ahora mismo, o null
  busyActionStartedAt: number | null;
  lastActionLog: { label: string; ok: boolean; detail: string }[];
  bgEvent: BackgroundEvent | null;
  demoBudget: DemoBudget | null;
}

export function useAvalDashboard() {
  const { t } = useI18n();
  const [assetId, setAssetId] = useState(DEFAULT_ASSET_ID);
  const [chainState, setChainState] = useState<ChainState | null>(null);
  const [runLog, setRunLog] = useState<RunLogEntry[]>([]);
  const [loadingChainState, setLoadingChainState] = useState(true);
  const [chainStateError, setChainStateError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [busyActionStartedAt, setBusyActionStartedAt] = useState<number | null>(null);
  const [lastActionLog, setLastActionLog] = useState<{ label: string; ok: boolean; detail: string }[]>([]);
  const [bgEvent, setBgEvent] = useState<BackgroundEvent | null>(null);
  const [demoBudget, setDemoBudget] = useState<DemoBudget | null>(null);
  const bgEventIdRef = useRef(0);

  // Emite un evento real para que Background3D pulse/ilumine/apague un nodo —
  // siempre disparado DESPUES de que la accion on-chain ya confirmo (nunca antes).
  const emitBgEvent = useCallback((kind: BackgroundEvent["kind"], tone: BackgroundEvent["tone"], wallet?: string) => {
    bgEventIdRef.current += 1;
    setBgEvent({ id: bgEventIdRef.current, kind, tone, wallet });
  }, []);

  const refresh = useCallback(async () => {
    setLoadingChainState(true);
    try {
      const [state, log, budget] = await Promise.all([fetchChainState(), fetchRunLog(), fetchDemoBudget()]);
      setChainState(state);
      setRunLog(log);
      setDemoBudget(budget);
      setChainStateError(null);
    } catch (err) {
      setChainStateError(err instanceof Error ? err.message : t("error.readingChain"));
    } finally {
      setLoadingChainState(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pushLog = useCallback((label: string, ok: boolean, detail: string) => {
    setLastActionLog(prev => [{ label, ok, detail }, ...prev].slice(0, 20));
  }, []);

  const runAction = useCallback(
    async (
      key: string,
      label: string,
      fn: () => Promise<{ exitCode: number; stdout: string }>,
      onSuccess?: () => void
    ) => {
      if (busyAction) return;
      setBusyAction(key);
      setBusyActionStartedAt(Date.now());
      try {
        const result = await fn();
        const ok = result.exitCode === 0;
        pushLog(label, ok, ok ? t("action.success") : t("action.checkConsole"));
        if (ok) onSuccess?.();
      } catch (err) {
        pushLog(label, false, err instanceof Error ? err.message : t("action.unknownError"));
      } finally {
        setBusyAction(null);
        setBusyActionStartedAt(null);
        await refresh();
      }
    },
    [busyAction, pushLog, refresh, t]
  );

  const actions = {
    runUnderwriterA: (stakeCspr: number) =>
      runAction(
        "underwriter_A",
        t("action.underwriterA"),
        () => runUnderwriter({ wallet: "underwriter_A", assetId, stakeCspr, profile: "conservative" as ProfileKey }),
        () => {
          emitBgEvent("pulse", "senior", "underwriter_A");
          setTimeout(() => emitBgEvent("link", "senior", "underwriter_A"), 550);
        }
      ),
    runUnderwriterB: (stakeCspr: number) =>
      runAction(
        "underwriter_B",
        t("action.underwriterB"),
        () => runUnderwriter({ wallet: "underwriter_B", assetId, stakeCspr, profile: "aggressive" as ProfileKey }),
        () => {
          emitBgEvent("pulse", "junior", "underwriter_B");
          setTimeout(() => emitBgEvent("link", "junior", "underwriter_B"), 550);
        }
      ),
    buySenior: (amountCspr: number) =>
      runAction(
        "buy_senior",
        t("action.buySenior"),
        () => investInTranche({ entryPoint: "buy_senior", amountCspr }),
        () => emitBgEvent("pulse", "senior", "investor")
      ),
    buyJunior: (amountCspr: number) =>
      runAction(
        "buy_junior",
        t("action.buyJunior"),
        () => investInTranche({ entryPoint: "buy_junior", amountCspr }),
        () => emitBgEvent("pulse", "junior", "investor")
      ),
    markDefault: (lossAmountCspr: number) =>
      runAction(
        "mark_default",
        t("action.markDefault"),
        () => markDefault({ assetId, lossAmountCspr }),
        () => emitBgEvent("kill", "danger", "underwriter_B")
      ),
    runFullDemo: (params: { aStakeCspr: number; bStakeCspr: number; investorSeniorCspr: number; investorJuniorCspr: number; lossAmountCspr: number }) =>
      runAction(
        "demo_run",
        t("action.demoRun"),
        () => runFullDemo({ assetId, ...params }),
        () => emitBgEvent("celebrate", "brand")
      ),
    refresh,
  };

  return {
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
  };
}

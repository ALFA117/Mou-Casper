"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChainState, RunLogEntry, ProfileKey, BackgroundEvent, DemoBudget, ActionRejectionReason } from "./types";
import { getPrimaryHash } from "./types";
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

// El RPC publico de testnet falla seguido (413/500 pasajeros) incluso despues
// del retry del server (casper-read.ts). Los dos primeros reintentos son
// callados; despues se avisa, pero se SIGUE reintentando de verdad con
// espera creciente -- el mensaje "reintentando" solo se muestra mientras hay
// un reintento programado. Al agotar la lista se dice claro que se rindio y
// que el boton Refrescar vuelve a intentar.
const CHAIN_STATE_RETRY_DELAYS_MS = [1200, 2500, 5000, 10000, 20000, 30000];
const CHAIN_STATE_SILENT_RETRIES = 2;

export type ChainStateErrorKey = "error.chainStateRetrying" | "error.chainStateGaveUp";

export interface AvalDashboardState {
  assetId: string;
  chainState: ChainState | null;
  runLog: RunLogEntry[];
  runLogStatus: "loading" | "ready" | "error";
  loadingChainState: boolean;
  chainStateError: ChainStateErrorKey | null;
  busyAction: string | null; // qué botón está corriendo ahora mismo, o null
  busyActionStartedAt: number | null;
  lastActionLog: { label: string; ok: boolean; detail: string; hash: string | null }[];
  bgEvent: BackgroundEvent | null;
  demoBudget: DemoBudget | null;
}

export function useAvalDashboard({ readOnly }: { readOnly: boolean }) {
  const { t } = useI18n();
  const [assetId, setAssetId] = useState(DEFAULT_ASSET_ID);
  const [chainState, setChainState] = useState<ChainState | null>(null);
  const [runLog, setRunLog] = useState<RunLogEntry[]>([]);
  const [runLogStatus, setRunLogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingChainState, setLoadingChainState] = useState(true);
  const [chainStateError, setChainStateError] = useState<ChainStateErrorKey | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [busyActionStartedAt, setBusyActionStartedAt] = useState<number | null>(null);
  const [lastActionLog, setLastActionLog] = useState<
    { label: string; ok: boolean; detail: string; hash: string | null }[]
  >([]);
  const [bgEvent, setBgEvent] = useState<BackgroundEvent | null>(null);
  const [demoBudget, setDemoBudget] = useState<DemoBudget | null>(null);
  const bgEventIdRef = useRef(0);
  // Cada refresh() sube este contador: un ciclo de reintentos viejo (o uno de
  // un componente ya desmontado) se corta solo en vez de pisar al nuevo.
  const refreshGenerationRef = useRef(0);

  // Emite un evento real para que Background3D pulse/ilumine/apague un nodo —
  // siempre disparado DESPUES de que la accion on-chain ya confirmo (nunca antes).
  const emitBgEvent = useCallback((kind: BackgroundEvent["kind"], tone: BackgroundEvent["tone"], wallet?: string) => {
    bgEventIdRef.current += 1;
    setBgEvent({ id: bgEventIdRef.current, kind, tone, wallet });
  }, []);

  // El feed (run-log.json) y el estado on-chain (RPC de testnet) se cargan por
  // separado: antes iban juntos en un Promise.all y una caida del RPC dejaba
  // tambien el feed vacio aunque /api/runs respondiera bien.
  const loadRunLog = useCallback(async () => {
    try {
      const log = await fetchRunLog();
      setRunLog(log);
      setRunLogStatus("ready");
    } catch {
      setRunLogStatus(prev => (prev === "ready" ? prev : "error"));
    }
  }, []);

  const loadChainState = useCallback(async (generation: number) => {
    setLoadingChainState(true);
    for (let attempt = 0; attempt <= CHAIN_STATE_RETRY_DELAYS_MS.length; attempt++) {
      if (generation !== refreshGenerationRef.current) return;
      try {
        const state = await fetchChainState();
        if (generation !== refreshGenerationRef.current) return;
        setChainState(state);
        setChainStateError(null);
        setLoadingChainState(false);
        return;
      } catch {
        if (generation !== refreshGenerationRef.current) return;
        const delay = CHAIN_STATE_RETRY_DELAYS_MS[attempt];
        if (delay === undefined) break;
        if (attempt + 1 >= CHAIN_STATE_SILENT_RETRIES) setChainStateError("error.chainStateRetrying");
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    if (generation !== refreshGenerationRef.current) return;
    setChainStateError("error.chainStateGaveUp");
    setLoadingChainState(false);
  }, []);

  const refresh = useCallback(async () => {
    const generation = ++refreshGenerationRef.current;
    const tasks: Promise<unknown>[] = [loadRunLog(), loadChainState(generation)];
    // El presupuesto de demo solo se muestra fuera de Vercel (ver SiteHeader):
    // en el deploy de solo lectura eran 4 lecturas RPC extra por visita, sin uso.
    if (!readOnly) tasks.push(fetchDemoBudget().then(setDemoBudget).catch(() => setDemoBudget(null)));
    await Promise.all(tasks);
  }, [loadRunLog, loadChainState, readOnly]);

  useEffect(() => {
    refresh();
    return () => {
      // Corta cualquier ciclo de reintentos pendiente al desmontar.
      refreshGenerationRef.current += 1;
    };
  }, [refresh]);

  const pushLog = useCallback((label: string, ok: boolean, detail: string, hash: string | null = null) => {
    setLastActionLog(prev => [{ label, ok, detail, hash }, ...prev].slice(0, 20));
  }, []);

  // Arma el detalle de fallo especifico y legible -- nunca un generico
  // "check console" cuando ya sabemos la razon real (bloqueo de tunel,
  // cooldown, tope horario, o el stderr real del script).
  const describeFailure = useCallback(
    (result: {
      stderr?: string;
      reason?: ActionRejectionReason;
      retryAfterSeconds?: number;
    }): string => {
      if (result.reason === "read_only") return t("action.reason.readOnly");
      if (result.reason === "tunnel_disabled") return t("action.reason.tunnelDisabled");
      if (result.reason === "concurrent_lock") return t("action.reason.concurrentLock");
      if (result.reason === "hourly_cap") return t("action.reason.hourlyCap");
      if (result.reason === "cooldown") {
        const secs = Math.max(0, result.retryAfterSeconds ?? 0);
        const mm = Math.floor(secs / 60);
        const ss = String(secs % 60).padStart(2, "0");
        return t("action.reason.cooldown", { time: `${mm}:${ss}` });
      }
      return result.stderr?.trim() || t("action.checkConsole");
    },
    [t]
  );

  const runAction = useCallback(
    async (
      key: string,
      label: string,
      fn: () => Promise<{
        exitCode: number;
        stdout: string;
        stderr?: string;
        reason?: ActionRejectionReason;
        retryAfterSeconds?: number;
        newLogEntries?: RunLogEntry[];
      }>,
      onSuccess?: () => void
    ) => {
      if (busyAction) return;
      setBusyAction(key);
      setBusyActionStartedAt(Date.now());
      try {
        const result = await fn();
        const ok = result.exitCode === 0;
        const lastEntry = result.newLogEntries?.[result.newLogEntries.length - 1];
        const hash = ok && lastEntry ? getPrimaryHash(lastEntry) : null;
        pushLog(label, ok, ok ? t("action.success") : describeFailure(result), hash);
        if (ok) onSuccess?.();
      } catch (err) {
        pushLog(label, false, err instanceof Error ? err.message : t("action.unknownError"));
      } finally {
        setBusyAction(null);
        setBusyActionStartedAt(null);
        await refresh();
      }
    },
    [busyAction, pushLog, refresh, t, describeFailure]
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
    runLogStatus,
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

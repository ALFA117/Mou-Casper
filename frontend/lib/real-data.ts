/**
 * Client-side data layer. Every function here hits one of our own Next.js
 * route handlers (app/api/**), which do the actual Casper RPC / child-process
 * work server-side. The browser never talks to the Casper RPC node directly
 * (CORS, and it would leak the dictionary-key decode logic client-side).
 */
import type { ChainState, RunLogEntry, ScriptRunResult, ProfileKey } from "./types";

export async function fetchChainState(): Promise<ChainState> {
  const res = await fetch("/api/chain/state", { cache: "no-store" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo leer el estado on-chain");
  return res.json();
}

export async function fetchRunLog(): Promise<RunLogEntry[]> {
  const res = await fetch("/api/runs", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.log ?? [];
}

export async function runUnderwriter(params: {
  wallet: "underwriter_A" | "underwriter_B";
  assetId: string;
  stakeCspr: number;
  profile: ProfileKey;
}): Promise<ScriptRunResult> {
  const res = await fetch("/api/actions/run-underwriter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "El agente underwriter fallo");
  return data;
}

export async function investInTranche(params: {
  entryPoint: "buy_senior" | "buy_junior";
  amountCspr: number;
}): Promise<ScriptRunResult> {
  const res = await fetch("/api/actions/invest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "La compra de tramo fallo");
  return data;
}

export async function markDefault(params: {
  assetId: string;
  lossAmountCspr: number;
}): Promise<ScriptRunResult> {
  const res = await fetch("/api/actions/mark-default", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "La cadena del servicer fallo");
  return data;
}

export async function runFullDemo(params: {
  assetId: string;
  aStakeCspr: number;
  bStakeCspr: number;
  investorSeniorCspr: number;
  investorJuniorCspr: number;
  lossAmountCspr: number;
}): Promise<ScriptRunResult> {
  const res = await fetch("/api/actions/demo-run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "demo-run fallo");
  return data;
}

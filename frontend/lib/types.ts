/**
 * Shared domain types for the AVAL dashboard — Paso 11: wired to real
 * on-chain reads and real agent runs. No fabricated data: `ChainState`
 * comes from app/api/chain/state (query_global_state against known
 * Casper Dictionary keys, see lib/server/chain-config.ts) and
 * `RunLogEntry` comes from app/api/runs (agents/run-log.json, appended
 * to by the real agent scripts after real transactions).
 */

export type ProfileKey = "conservative" | "aggressive";
export type TrancheKind = "senior" | "junior";
export type WalletId = "underwriter_A" | "underwriter_B" | "servicer" | "investor";

export interface ChainState {
  underwriters: {
    underwriter_A: { stakeCspr: number; reputation: number };
    underwriter_B: { stakeCspr: number; reputation: number };
  };
  vault: {
    seniorOutstandingCspr: number;
    juniorOutstandingCspr: number;
    investorHoldingSeniorCspr: number;
    investorHoldingJuniorCspr: number;
  };
  readAt: string;
}

export interface RiskData {
  assetId: string;
  defaultProbabilityBps: number;
  recommendedSpreadBps: number;
  source: string;
  timestamp: string;
}

export interface LlmQuote {
  rating: number;
  recommended_tranche: TrancheKind;
  price_bps: number;
  short_reasoning: string;
  extended_reasoning: string;
}

export interface UnderwriterRunEntry {
  type: "underwriter";
  walletName: "underwriter_A" | "underwriter_B";
  assetId: string;
  profileKey: ProfileKey;
  stakeAmountCspr: number;
  riskData: RiskData;
  quote: LlmQuote;
  reasoningHash: string;
  hashes: { x402: string | null; register: string; stake: string; attest: string };
  success: boolean;
  loggedAt: string;
}

export interface InvestorBuyRunEntry {
  type: "investor_buy";
  entryPoint: "buy_senior" | "buy_junior";
  assetId?: string;
  amountCspr: number;
  hash: string;
  success: boolean;
  loggedAt: string;
}

export interface ConstitutionTestRunEntry {
  type: "constitution_test";
  assetId: string;
  requestedExposureCspr: number;
  hash: string;
  errorCode: number;
  errorName: string;
  success: boolean;
  testPassed: boolean;
  loggedAt: string;
}

export interface DefaultChainRunEntry {
  type: "default_chain";
  assetId: string;
  lossAmountCspr: number;
  slashBps: number;
  penalizePoints: number;
  rewardPoints: number;
  hashes: { markDefault: string; slash: string; penalize: string; reward: string };
  success: boolean;
  loggedAt: string;
}

export type RunLogEntry =
  | UnderwriterRunEntry
  | InvestorBuyRunEntry
  | ConstitutionTestRunEntry
  | DefaultChainRunEntry;

export interface ScriptRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  newLogEntries: RunLogEntry[];
  // Solo presentes cuando lib/server/demo-guard.ts rechazo la accion (nunca
  // llego a tocar el script real) -- el cliente los usa para armar el
  // mensaje del toast en el idioma activo, ver lib/use-aval-dashboard.ts.
  reason?: "tunnel_disabled" | "concurrent_lock" | "cooldown" | "hourly_cap";
  retryAfterSeconds?: number;
}

// El hash "cabecera" de cada tipo de entrada -- el que mas vale la pena poner
// a un clic en el toast de exito (ver lib/use-aval-dashboard.ts). Para
// default_chain es el slash (el evento dramatico), no el ultimo cronologico.
export function getPrimaryHash(entry: RunLogEntry): string | null {
  switch (entry.type) {
    case "underwriter":
      return entry.hashes.attest;
    case "investor_buy":
      return entry.hash;
    case "constitution_test":
      return entry.hash;
    case "default_chain":
      return entry.hashes.slash;
  }
}

// Disparado por acciones reales ya confirmadas (nunca simulado) para que
// Background3D pueda reaccionar — ver lib/use-aval-dashboard.ts.
export interface BackgroundEvent {
  id: number;
  kind: "pulse" | "link" | "kill" | "celebrate";
  tone: "brand" | "senior" | "junior" | "danger";
  wallet?: string;
}

// Ver app/api/demo/budget — balance real (motes leidos on-chain, convertidos
// a CSPR) de las wallets que financian las acciones, mas el estado del
// rate-limit publico (solo aplica cuando se llega por el tunel, no en local).
export interface DemoBudget {
  totalBalanceCspr: number;
  isPublic: boolean;
  demoRunEnabled: boolean;
  cooldownRemainingSeconds: number;
  actionsUsedThisHour: number;
  actionsCapPerHour: number;
}

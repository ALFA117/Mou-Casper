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
}

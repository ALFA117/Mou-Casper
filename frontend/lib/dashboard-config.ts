/**
 * Client-safe config: display labels and cost estimates only. No RPC URLs,
 * no dictionary keys, no contract hashes — those live server-only in
 * lib/server/chain-config.ts and are never imported from a "use client" file.
 */

export const DEFAULT_ASSET_ID = "invoice-batch-002";

export const WALLET_LABELS: Record<string, string> = {
  underwriter_A: "Underwriter A",
  underwriter_B: "Underwriter B",
  servicer: "Servicer / Monitor",
  investor: "Investor Agent",
};

export const PROFILE_LABELS: Record<"conservative" | "aggressive", string> = {
  conservative: "Conservador",
  aggressive: "Agresivo / Optimista",
};

// Estimado neto (payment - reembolso, ver tareas.md) de lo que gasta CADA
// boton al dispararse de verdad. Se muestra en el boton antes de hacer clic.
export const ACTION_COST_ESTIMATES_CSPR = {
  runUnderwriter: 55,
  investTranche: 40,
  markDefault: 30,
  fullDemoRun: 180,
};

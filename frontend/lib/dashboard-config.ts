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

// Mensajes de espera honestos (no un progreso falso) para las acciones que
// firman/envian deploys reales a Casper Testnet. Los umbrales reflejan tiempos
// de confirmacion tipicos observados durante el desarrollo (ver tareas.md).
const SINGLE_ACTION_WAIT_STAGES = [
  { atSeconds: 0, text: "Firmando y enviando el deploy a Casper Testnet…" },
  { atSeconds: 15, text: "Esperando confirmación de bloque (~2 min típico)…" },
  { atSeconds: 60, text: "El nodo sigue procesando — esto es normal en testnet…" },
  { atSeconds: 120, text: "Tardando más de lo usual, pero sigue en curso — no cierres esta pestaña…" },
];

const DEMO_RUN_WAIT_STAGES = [
  { atSeconds: 0, text: "Arrancando el arco completo: 2 underwriters, investor y servicer…" },
  { atSeconds: 20, text: "Underwriters pagando x402 y cotizando con Gemini real…" },
  { atSeconds: 60, text: "Firmando stakes y atestaciones en Testnet…" },
  { atSeconds: 150, text: "Investor comprando tramos senior/junior…" },
  { atSeconds: 240, text: "Ejecutando el clímax: mark_default → slash → penalize/reward…" },
  { atSeconds: 360, text: "Cerrando el arco — puede tardar hasta ~10 min en total…" },
];

export function getWaitingMessage(actionKey: string, elapsedSeconds: number): string {
  const stages = actionKey === "demo_run" ? DEMO_RUN_WAIT_STAGES : SINGLE_ACTION_WAIT_STAGES;
  let current = stages[0].text;
  for (const stage of stages) {
    if (elapsedSeconds >= stage.atSeconds) current = stage.text;
  }
  return current;
}

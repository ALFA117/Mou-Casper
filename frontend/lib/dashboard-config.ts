/**
 * Client-safe config: display labels and cost estimates only. No RPC URLs,
 * no dictionary keys, no contract hashes — those live server-only in
 * lib/server/chain-config.ts and are never imported from a "use client" file.
 */
import type { TranslationKey } from "./i18n/dictionary";

export const DEFAULT_ASSET_ID = "invoice-batch-002";

// Estimado neto (payment - reembolso, ver tareas.md) de lo que gasta CADA
// boton al dispararse de verdad. Se muestra en el boton antes de hacer clic.
export const ACTION_COST_ESTIMATES_CSPR = {
  runUnderwriter: 55,
  investTranche: 40,
  markDefault: 30,
  fullDemoRun: 180,
};

export const GITHUB_REPO_URL = "https://github.com/ALFA117/Mou-Casper";
export const CASPER_FAUCET_URL = "https://testnet.cspr.live/tools/faucet";

// Package hashes are public on-chain data (also committed in deployments.json
// and README.md) -- listing them here, in a client-safe file, is what makes
// the "on-chain credibility" links in the footer possible without pulling in
// lib/server/chain-config.ts (which stays server-only for the *reads*).
export const DEPLOYED_CONTRACTS: { name: string; packageHash: string }[] = [
  { name: "Constitution", packageHash: "26b1def3934199cfcc814cbe81a9ad377d982452c35bd103e315b08b3c70faf7" },
  { name: "Reputation", packageHash: "3ee548b28300fe3fc9182aa4bfc747596ab4eded0d7ab4ec23d1da91cb003516" },
  { name: "UnderwriterStake", packageHash: "8f0371913f6d61d11d7e82c5b862c6a3d28f987cdf48084ed903623c26cc4fb4" },
  { name: "AttestationRegistry", packageHash: "7bd8579d79bb857adfdbc3e3f288275ddae9078d2fe511585860784742357940" },
  { name: "TrancheVault", packageHash: "449c08c7d24655aafe27dc4e49964374910fdb6c69bfbd09700332a134b78296" },
];

// Mensajes de espera honestos (no un progreso falso) para las acciones que
// firman/envian deploys reales a Casper Testnet. Los umbrales reflejan tiempos
// de confirmacion tipicos observados durante el desarrollo (ver tareas.md).
// Devuelve la KEY del diccionario i18n, no el texto — quien llama decide el idioma.
const SINGLE_ACTION_WAIT_STAGES: { atSeconds: number; key: TranslationKey }[] = [
  { atSeconds: 0, key: "wait.single.0" },
  { atSeconds: 15, key: "wait.single.15" },
  { atSeconds: 60, key: "wait.single.60" },
  { atSeconds: 120, key: "wait.single.120" },
];

const DEMO_RUN_WAIT_STAGES: { atSeconds: number; key: TranslationKey }[] = [
  { atSeconds: 0, key: "wait.demo.0" },
  { atSeconds: 20, key: "wait.demo.20" },
  { atSeconds: 60, key: "wait.demo.60" },
  { atSeconds: 150, key: "wait.demo.150" },
  { atSeconds: 240, key: "wait.demo.240" },
  { atSeconds: 360, key: "wait.demo.360" },
];

export function getWaitingMessageKey(actionKey: string, elapsedSeconds: number): TranslationKey {
  const stages = actionKey === "demo_run" ? DEMO_RUN_WAIT_STAGES : SINGLE_ACTION_WAIT_STAGES;
  let current = stages[0].key;
  for (const stage of stages) {
    if (elapsedSeconds >= stage.atSeconds) current = stage.key;
  }
  return current;
}

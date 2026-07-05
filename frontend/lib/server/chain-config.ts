/**
 * SERVER-ONLY config. Never import this from a "use client" component —
 * only from route handlers (app/api/**) or other server/server files.
 * Nothing here has the NEXT_PUBLIC_ prefix, so Next.js never inlines it
 * into the client bundle.
 *
 * Dictionary keys were discovered once (Paso 11) via a real, paid call to
 * each getter — casper-js-sdk / this node don't expose a return value for
 * a committed deploy, but the execution effects DO reveal the exact
 * Casper Dictionary key that was touched. Once known, that key is the
 * final address in global state and can be read for free forever after
 * with query_global_state. See tareas.md Paso 10/11 for the full
 * derivation log and scripts/discover-dictionary-key.js to add more.
 */

export const RPC_URL = process.env.CASPER_NODE_RPC_URL || "https://node.testnet.casper.network/rpc";

export const CONTRACT_HASHES = {
  trancheVault: process.env.TRANCHE_VAULT_CONTRACT_HASH || "",
  attestationRegistry: process.env.ATTESTATION_REGISTRY_CONTRACT_HASH || "",
  underwriterStake: process.env.UNDERWRITER_STAKE_CONTRACT_HASH || "",
  reputation: process.env.REPUTATION_CONTRACT_HASH || "",
  constitution: process.env.CONSTITUTION_CONTRACT_HASH || "",
};

export type DictValueType = "U512" | "U32";

export interface DictEntry {
  key: string;
  type: DictValueType;
}

/**
 * Known dictionary keys, discovered once via scripts/discover-dictionary-key.js.
 * Values are in the smallest unit (motes for U512 CSPR amounts, raw score
 * for U32 reputation).
 */
export const DICTIONARY_KEYS: Record<string, DictEntry> = {
  "underwriterStake.stakes.underwriter_A": {
    key: "dictionary-41f196d849589351ea849afc8baf8864bc934a6018e69c695a5715e129024a1e",
    type: "U512",
  },
  "underwriterStake.stakes.underwriter_B": {
    key: "dictionary-8cddc301fc82835c2e7e38e5765d764f363fefb504bb38a17874a9395ea42d28",
    type: "U512",
  },
  "reputation.scores.underwriter_A": {
    key: "dictionary-20d6d7976fcfe015700efc6a65ba4ff1fb4f2bab22f3d65917cabe4fae6fc1b2",
    type: "U32",
  },
  "reputation.scores.underwriter_B": {
    key: "dictionary-e63f1b00352ad0f5fb3e6d47d1c8679a43d525991f2836b1b8a97aa5af43a717",
    type: "U32",
  },
  "trancheVault.seniorOutstanding": {
    key: "dictionary-4c95b71f7ea66980eb453c7024ed8fff00005527c5db3c930bbd43b2809a90ce",
    type: "U512",
  },
  "trancheVault.juniorOutstanding": {
    key: "dictionary-ad0e8b96d9cc79f65f7fb2d5a4fb9f200b395972c3ccb75c41af9395c8bb5155",
    type: "U512",
  },
  "trancheVault.holdingOfSenior.investor": {
    key: "dictionary-1987d3a6ba9e1bcddb58c7762c317bf2de1b7a9ffc4509bffe513282efe476ef",
    type: "U512",
  },
  "trancheVault.holdingOfJunior.investor": {
    key: "dictionary-dd9239b7a20a29484008ce2af08197b2899581f7c2d245a08767f4115e200538",
    type: "U512",
  },
};

export const WALLET_PUBLIC_KEYS = {
  servicer: "01b5f0782df0a5dcc29de6e97ff1703404708b9da149cf393c11f1ac69f6037090",
  underwriter_A: "01fb6f5ad190283a69cf306dbc21752df53532692bb659d8a4aed8ed81b8804d5e",
  underwriter_B: "01c76517bf81263cc1f9c06a8fb7c7da3d1ecf214481f746a660dd7337b130b736",
  investor: "01c0c4c0d7729f3f83e5cd55bfab1f060155a08d95c091046586c07498ce211910",
};

export const CSPR_EXPLORER_URL = process.env.NEXT_PUBLIC_CASPER_EXPLORER_URL || "https://testnet.cspr.live";

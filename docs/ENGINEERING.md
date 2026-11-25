# Engineering notes

Moved from the main [README](../README.md) to keep it short. Full session-by-session log: [`tareas.md`](../tareas.md) · condensed write-up: [`REPORTE-SESION.md`](../REPORTE-SESION.md).

## How the dashboard reads real state without a browser-side RPC call

Odra's `Mapping`/`Var`
storage isn't directly readable from a return value (Casper doesn't surface entry-point return
values for a committed deploy, and `speculative_exec` isn't enabled on the public RPC). Instead,
a real (cheap, ~10 CSPR) call to a getter reveals the exact Casper `Dictionary` key it touched in
its execution effects — that key is the final address in global state, so once known it can be
read **for free, forever**, via `query_global_state`. Full derivation log and the 8 known keys:
`tareas.md`, Paso 10/11.

## Hard-won lessons (the parts a judge might actually ask about)

- **`invalid pricing mode` never happened.** The real blocker installing contracts was
  `Wasm preprocessing error: Bulk memory operations are not supported` — `wasm-opt`/`wasm-strip`
  weren't installed, so Rust's precompiled `core`/`alloc` for `wasm32-unknown-unknown` shipped
  bulk-memory instructions our own `RUSTFLAGS` couldn't remove. Fixed by installing Binaryen +
  WABT and letting `cargo-odra`'s lowering pass actually run.
- **`casper-js-sdk`'s `CLValue.newCLString` mis-encodes non-ASCII text** — it sizes the length
  prefix with JS's UTF-16 `.length` instead of the real UTF-8 byte count, silently corrupting any
  string with accents once deserialized on-chain. Found because Underwriter B's Spanish reasoning
  (with tildes) made `attest()` revert with an opaque `User error: 64649`. Fix: transliterate to
  ASCII before sending on-chain text; decoded Odra's own error-code scheme
  (`64536 + enum discriminant`) to confirm it was exactly `LeftOverBytes`.
- **Casper refunds unused gas — and we didn't notice for a while.** Our own cost tracking read
  `execution_result.cost` (the declared payment) and never looked at the sibling `refund` field.
  Real net cost of an entry-point call turned out to be ~3–6 CSPR, not the 15 CSPR we budgeted.
- **`UnderwriterStake.slash()` can't pay a contract.** Its `beneficiary` argument only works for
  an account — Odra blocks `transfer_tokens` into a contract without a payable receiver
  (`ExecutionError::TransferToContract`). Slashed funds go to the `servicer` account instead.
- **Payable entry points need Odra's "proxy caller" session wasm.** Casper's legacy Deploy format
  has no native way to attach value to a `StoredContractByHash` call — a call to `stake()` or
  `buy_senior()` from an external client has to go through a small pre-built session wasm
  (`odra-casper/test-vm/resources/proxy_caller_with_return.wasm`, vendored in `scripts/wasm-tools/`)
  that tops up a `cargo_purse` before invoking the entry point.

## Status

- [x] Fase A — toolchain, real deploy pipeline, 5 contracts + hello, all `success` on Testnet.
- [x] Fase B — x402 service, both underwriter agents, investor agent, servicer/monitor chain,
      `demo:run` orchestrator, full arc verified end-to-end.
- [x] Fase C (Paso 11) — dashboard wired to real on-chain reads + real action triggers, zero mock
      data left in the repo (verified: `grep -rniE "mock|fake|stub|dummy|hardcoded"` across the
      whole tree returns nothing but comments that say "this is NOT mock").
- [x] Paso 12 — visual design pass: Casper brand identity (neon red/black), real logo, i18n
      (ES/EN), accessible tooltips, polished animations.
- [x] Paso 13 — `Background3D` reactive to real on-chain events (x402 payments, stakes,
      attestations, slashing), degrades gracefully without WebGL.
- [x] Post-Paso-13 polish — public interactive demo via Cloudflare Tunnel during the buildathon
      (visitors triggered real testnet transactions signed by the project's own agent wallets;
      offline since);
      Gemini calls hardened with retry + model fallback against transient 429/503s; frontend
      served in production mode (`next build && next start`) for the public tunnel to avoid the
      dev-mode error overlay.
- [ ] **Paso 14 — dry run for the recorded demo video, not closed.** Register/stake/attest for
      both underwriters, tranche purchases, and the `Constitution` exposure-limit revert all pass
      with real testnet transactions. Blocked on an on-chain revert (`User error: 64658`) when
      settling x402 payments against the *shared* testnet WCSPR contract — confirmed it isn't a
      bug in this repo (balance, nonce/time window, and package-hash resolution all check out);
      buildathon organizers confirmed (2026-07-25) it's a known issue on their end. The 25 Jul
      2026 dry runs therefore quoted **without** risk data (no x402 payment, empty `riskData`) —
      those are the "latest quotes" the dashboard shows, and it says so. Not re-tested since.
- [ ] Paso 15 — README ✅ + [session report](./REPORTE-SESION.md) ✅ written; blocked on closing
      Paso 14 first before this counts as done. Then: run `Mou-Casper-Fase2-Auditoria.md` (not
      yet defined).
- [x] Sep 2026 — `Constitution` exposure check wired into `UnderwriterStake`/`TrancheVault`, both
      redeployed (v2 in the table above). The agents' recorded runs and the dashboard still use
      the July contracts.

## Long-term plan

The buildathon MVP was scoped down on purpose (see `Mou-Casper.md` §7): one RWA type, two
underwriters, two tranches, no live DEX integration. Past the buildathon:

- **More RWA types.** Invoices/receivables were the pilot; the same
  Constitution/Reputation/AttestationRegistry pattern generalizes to other short-duration
  real-world assets without redesigning the underwriting mechanics.
- **Underwriter swarms.** The conservative-vs-aggressive pair proves the slashing mechanic works;
  scaling to N agents with more varied risk profiles is a config change to
  `underwriter-agent.mjs`, not a contract change.
- **Secondary market for tranches.** Senior/junior positions are currently buy-and-hold. A real
  secondary market needs live DEX liquidity on Casper, which wasn't reliably available on testnet
  during the buildathon — mainnet-only.
- **Mainnet deployment.** Everything here targets Testnet by design — real transactions, zero
  mocks, zero real money at risk while the mechanism gets battle-tested. Moving to mainnet needs
  an external security review of the 5 Odra contracts first; `Constitution`'s exposure limits and
  `UnderwriterStake.slash()` are the two entry points that would actually move real funds.
- **Keep building in public.** This repo's `tareas.md` is already a public, warts-and-all
  engineering log of the buildathon build; the plan is to keep that habit going post-buildathon
  rather than switch to a curated changelog.

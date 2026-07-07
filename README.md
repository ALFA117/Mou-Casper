# AVAL — Autonomous Securitization Desk for the Agent Economy

> Casper Agentic Buildathon 2026 — Casper Innovation Track (Agentic AI + DeFi + RWA)

**One-line pitch:** AVAL is the autonomous securitization desk for the agent economy. Two AI
underwriter agents — one conservative, one aggressive — independently pay for risk data via
x402, quote the **same** real-world receivable with a real LLM (Gemini), stake real CSPR behind
their own opinion, and get **slashed on-chain, live**, when the one who under-priced risk turns
out to be wrong.

Every number in this README is a real, verifiable Casper Testnet transaction. Nothing here is
mocked, simulated, or computed off-chain without an on-chain transaction backing it.

Full build brief: [`Mou-Casper.md`](./Mou-Casper.md). Complete session-by-session engineering log
(every bug, every fix, every real cost): [`tareas.md`](./tareas.md) — 600+ lines of "here's
exactly what broke and how we found out."

## Live dashboard

**[mou-casper.vercel.app](https://mou-casper.vercel.app)** — read-only view of the current
on-chain state (stakes, reputation, tranches), refreshed live from Casper Testnet. Action buttons
(run an agent, mark a default) are disabled on Vercel — they need local secret keys and a
locally-hosted x402 facilitator that can't run in a serverless function.

When the "🔴 Try the live interactive demo" banner is showing, it points at a Cloudflare Tunnel
into the operator's own local instance — every button there fires a real transaction, no wallet
or faucet needed to watch it. **The live demo signs with the project's own agent wallets — that's
the thesis, the agents are the ones who sign.** To operate with your own keys instead, see
[Run it yourself](#run-it-yourself) below.

## What's actually implemented

- [x] **5 Odra smart contracts** deployed to Casper Testnet: `Constitution`, `Reputation`,
      `UnderwriterStake`, `AttestationRegistry`, `TrancheVault` (+ a `hello` sanity-check).
- [x] **Self-hosted x402 facilitator + resource server** (`/x402-service`) selling real risk-data,
      paid per-request in WCSPR, settled on-chain via `casper-x402` (official npm packages).
- [x] **Two competing Underwriter Agents** (`agents/underwriter-agent.mjs`) — same code,
      parametrized by a `conservative` / `aggressive` risk profile fed into the LLM prompt (the
      discrepancy is prompt-driven, not hardcoded numbers). Real loop: pay x402 → quote with
      Gemini 2.5 Flash → register → stake CSPR → attest on-chain.
- [x] **Investor Agent** (`agents/investor-agent.mjs`) buying into senior/junior tranches.
- [x] **Servicer/Monitor Agent** (`agents/servicer-agent.mjs`) — the climax: `mark_default` →
      waterfall hits junior first → `slash` the underwriter who under-priced risk (bps computed
      from their real quote vs. the real market spread) → `penalize`/`reward` in `Reputation`.
- [x] **`demo:run`** (`agents/demo-run.mjs`) — the entire arc above, end-to-end, in one command,
      including a deliberate test that `Constitution` reverts when exposure limits are exceeded.
- [x] **Next.js dashboard** reading live on-chain state through its own API routes (the browser
      never talks to the Casper RPC node directly) and triggering the real agent scripts from UI
      buttons.

## Architecture

```
/contracts      Odra (Rust/WASM) — Constitution, Reputation, UnderwriterStake,
                AttestationRegistry, TrancheVault
/agents         Off-chain agents (Node.js/ESM): underwriter, investor, servicer,
                demo-run orchestrator, run-log
/x402-service   Self-hosted x402 facilitator + resource server (risk-data feed)
/frontend       Next.js dashboard — server-only chain reads, real action triggers
/scripts        One-off deploy / inspection / calibration scripts (kept as a paper
                trail of how every real cost and dictionary key was discovered)
/keys           Generated testnet keypairs (gitignored, never committed)
```

**How the dashboard reads real state without a browser-side RPC call:** Odra's `Mapping`/`Var`
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

## Deployed contracts (Testnet)

Deployed by the `servicer` account (`01b5f078...37090`). Full detail (payment paid, constructor
args) in [`deployments.json`](./deployments.json) and `tareas.md`'s deploy log.

| Contract | Package hash | Deploy tx | Status |
|---|---|---|---|
| hello (sanity check) | [`hash-a35eee05...4774`](https://testnet.cspr.live/contract-package/a35eee053184dcece3fe9d98a840f80c5eafcc491e469b6b9e2ca8f08b954774) | [`892cbd2d...9858`](https://testnet.cspr.live/deploy/892cbd2d71fe3c3bd226ef2ce99ed31da19b5f723ca9d6c0e90e9c575cc79858) | success |
| Constitution | [`hash-26b1def3...0faf7`](https://testnet.cspr.live/contract-package/26b1def3934199cfcc814cbe81a9ad377d982452c35bd103e315b08b3c70faf7) | [`ff22ffb4...8a08a`](https://testnet.cspr.live/deploy/ff22ffb486e86d03ace66cbf93c8f0df6dbffaf191f6abeaccea0c288796a08a) | success |
| Reputation | [`hash-3ee548b2...03516`](https://testnet.cspr.live/contract-package/3ee548b28300fe3fc9182aa4bfc747596ab4eded0d7ab4ec23d1da91cb003516) | [`1642fa0f...0d23a6`](https://testnet.cspr.live/deploy/1642fa0fafc662b39272d0f74cc0e0fe3b6d9b26a47aa26428a196b0900d23a6) | success |
| UnderwriterStake | [`hash-8f037191...c4fb4`](https://testnet.cspr.live/contract-package/8f0371913f6d61d11d7e82c5b862c6a3d28f987cdf48084ed903623c26cc4fb4) | [`75d347d3...234bc3`](https://testnet.cspr.live/deploy/75d347d36e07cd4a4b56745ede66a3b71ad3055f4939e0be21a1eff29f234bc3) | success |
| AttestationRegistry | [`hash-7bd8579d...357940`](https://testnet.cspr.live/contract-package/7bd8579d79bb857adfdbc3e3f288275ddae9078d2fe511585860784742357940) | [`5b83cdb7...80602`](https://testnet.cspr.live/deploy/5b83cdb751288bce34bcf10fbdcac9c10ecdd97f8878daecda4002139c680602) | success |
| TrancheVault | [`hash-449c08c7...4b78296`](https://testnet.cspr.live/contract-package/449c08c7d24655aafe27dc4e49964374910fdb6c69bfbd09700332a134b78296) | [`30a4159d...dc65f0`](https://testnet.cspr.live/deploy/30a4159d63791f1c17a03384f46eb556df1d303fdae5faf188897dcfc4dc65f0) | success |

## Demo walkthrough

Follows Section 8 of `Mou-Casper.md`: two underwriters pay x402 for the same risk data and quote
opposite bets on the same asset (senior @ high spread vs. junior @ low spread) → investor buys
into both tranches → a simulated default is marked → the waterfall hits junior first → the
underwriter who under-priced risk is slashed live, reputation drops, the other is rewarded —
every step links to a real CSPR.live testnet tx. Run it yourself with `demo:run` (below).

## Run it yourself

Action buttons and the agent scripts need real secret keys and a real x402 facilitator — none of
that can run on Vercel. To use them with your own wallets instead of the live demo's:

1. `cp .env.example .env` at the repo root, and `cp x402-service/.env.example x402-service/.env`,
   `cp frontend/.env.example frontend/.env.local` — fill in `GEMINI_API_KEY` (free tier,
   [aistudio.google.com](https://aistudio.google.com/apikey)) and the contract hashes (already
   filled in the example files from the table above).
2. Generate wallets: `cd agents && node keygen.js <name>` for `servicer`, `underwriter_A`,
   `underwriter_B`, `investor`. Fund each from the
   [Casper testnet faucet](https://testnet.cspr.live/tools/faucet) (captcha, manual).
3. Install deps: `npm install` in `/agents`, `/x402-service`, and `/frontend`.
4. Start the x402 facilitator + resource server: `npx tsx facilitator.ts` and
   `npx tsx server.ts` in `/x402-service` (two terminals).
5. Run the full arc: `node agents/demo-run.mjs <assetId> <aStakeCspr> <bStakeCspr>
   <investorSeniorCspr> <investorJuniorCspr> <lossAmountCspr>`.
6. Start the dashboard: `npm run dev` in `/frontend`, open `http://localhost:3000` — action
   buttons are live here (they're only disabled when `process.env.VERCEL === "1"`).

## Status

- [x] Fase A — toolchain, real deploy pipeline, 5 contracts + hello, all `success` on Testnet.
- [x] Fase B — x402 service, both underwriter agents, investor agent, servicer/monitor chain,
      `demo:run` orchestrator, full arc verified end-to-end.
- [x] Fase C (Paso 11) — dashboard wired to real on-chain reads + real action triggers, zero mock
      data left in the repo (verified: `grep -rniE "mock|fake|stub|dummy|hardcoded"` across the
      whole tree returns nothing but comments that say "this is NOT mock").
- [ ] Paso 12 — visual design pass on the dashboard (functionally complete, not yet polished).
- [ ] Paso 13 — reactive 3D background tied to real events.
- [ ] Paso 14/15 — full dry run for the recorded demo video, final report.

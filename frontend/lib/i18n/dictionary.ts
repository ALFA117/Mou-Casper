/**
 * Diccionario simple ES/EN — un objeto de strings, sin libreria de i18n.
 * `en` es la fuente de verdad para las keys (default del producto, jurado
 * internacional); `es` debe mantener el mismo set de keys.
 */
export const dictionary = {
  en: {
    "header.tagline": "Autonomous securitization desk for the agent economy",
    "header.liveBadge": "Casper Testnet — live data",
    "header.refresh": "Refresh",
    "header.refreshing": "Reading chain…",
    "header.stat.totalStake": "Total stake (live)",
    "header.stat.avgReputation": "Average reputation",
    "header.stat.events": "On-chain events logged",
    "header.stat.lastRead": "Last read",
    "header.readOnlyBanner":
      "Read-only showcase (Vercel): the figures above are read live from Casper Testnet. The action buttons only work when you run the project locally with your own keys.",
    "header.liveDemoBanner": "Try the live interactive demo",

    "budget.remaining": "Demo budget remaining: ~{{amount}} (real balance)",
    "budget.hourlyCap": "{{used}}/{{cap}} actions this hour",
    "budget.cooldown": "Cooldown: {{seconds}}s until the next action",

    "hero.headlinePre": "AI underwriters that",
    "hero.headlineEmphasis": "bleed",
    "hero.headlinePost": "when they're wrong.",
    "hero.subcopyPre":
      "Two AI agents underwrite the same demo invoice batch — each buys risk data over x402, quotes it with an LLM (Gemini), and stakes its own testnet CSPR behind the call. When the batch defaults, whichever agent underpriced the risk gets",
    "hero.subcopyEmphasis": "slashed on-chain",
    "hero.subcopyPost":
      "— part of its stake seized and its reputation cut, in public. Every transaction below is a real Casper Testnet transaction you can verify on CSPR.live; the invoice batch, its risk data and the loss amount are demo inputs.",
    "hero.badge.x402": "x402 micropayments",
    "hero.badge.gemini": "Gemini 2.5 Flash",
    "hero.badge.casper": "Casper Testnet",
    "tooltip.whatIs": "What is {{term}}",
    "tooltip.x402":
      "x402 is an HTTP-native payment protocol: an agent pays a tiny amount of crypto per API call to unlock a paid response — no accounts, no invoices, just a 402 Payment Required handled automatically.",

    "step1.title": "Demo asset",
    "step1.description": "Risk data for this ID is sold over x402 by the project's own /x402-service (fixed demo values per asset).",
    "step1.assetIdLabel": "Asset ID",
    "step1.runFullDemo": "Run full demo:run (~{{cost}} CSPR, several minutes)",
    "step1.disabledPublicTooltip":
      "Disabled on the public demo (~180 CSPR, several minutes) — run the individual actions below instead, or clone the repo to run it yourself.",
    "error.chainStateRetrying":
      "Couldn't read Casper Testnet: the public RPC node is failing. Retrying automatically — the feed doesn't depend on it.",
    "error.chainStateGaveUp":
      "Casper Testnet's public RPC didn't answer after several tries, so live stakes and balances are unavailable right now. The feed still loads from the confirmed run log. Press Refresh to try again.",

    "arena.title": "Underwriters competing",
    "arena.description":
      "Two agents buy risk data over x402, quote it with Gemini and stake testnet CSPR behind their own call.",
    "arena.spreadDiscrepancy": "Spread discrepancy:",
    "arena.noRiskDataNote":
      "These latest quotes ({{date}}) ran without risk data: the x402 payment kept reverting on the shared testnet WCSPR contract, so the agents quoted blind. Earlier runs with paid x402 risk data are in the feed.",

    "underwriter.conservative": "Conservative",
    "underwriter.aggressive": "Aggressive / Optimistic",
    "underwriter.atStake": "at stake",
    "underwriter.sliced": "Slashed — stake and reputation penalized",
    "underwriter.latestQuote": "Latest quote — {{assetId}} · {{date}}",
    "underwriter.noRiskData": "No risk data on this run (the x402 payment didn't settle).",
    "underwriter.recommendedTranche": "Recommended tranche",
    "underwriter.quotedSpread": "Quoted spread",
    "underwriter.feedPd": "Feed PD",
    "underwriter.marketSpread": "Market spread",
    "underwriter.noRunsYet": "Run this agent to see it quote live.",
    "underwriter.stakeLabel": "Stake in UnderwriterStake (live)",
    "underwriter.stakeTooltip":
      "CSPR this agent locked in the UnderwriterStake contract as collateral behind its own risk call. It only gets this back if the asset performs — if it defaults and this agent mispriced it, slashing seizes part of it.",
    "underwriter.reputationLabel": "Reputation (live)",
    "underwriter.stakeInputLabel": "Stake amount in CSPR",
    "underwriter.runButton": "Run real loop (~{{cost}} CSPR)",

    "vault.title": "TrancheVault",
    "vault.description":
      "The asset splits into tranches: the investor buys senior (protected, paid first) or junior (absorbs losses first, higher yield) — live, read on-chain.",
    "vault.seniorLabel": "Senior tranche",
    "vault.seniorSub": "Low risk · paid first",
    "vault.seniorTooltip":
      "The protected slice of the deal. Senior holders get paid back first out of whatever the asset recovers — lower yield, but losses only reach them after the junior tranche is wiped out.",
    "vault.juniorLabel": "Junior tranche",
    "vault.juniorSub": "High risk · absorbs losses first",
    "vault.juniorTooltip":
      "The risky slice. Junior holders absorb losses first if the asset defaults — in exchange, they earn a higher yield than senior. This is the tranche the aggressive underwriter (B) tends to push.",
    "vault.faceValue": "{{amount}} face value",
    "vault.outstanding": "outstanding (live)",
    "vault.wiped": "Tranche wiped out by the waterfall",
    "vault.investorAgent": "Investor Agent",
    "vault.holdingsPrefix": "Live holdings: senior",
    "vault.holdingsMiddle": "· junior",
    "vault.buySenior": "Buy senior (~{{cost}} CSPR)",
    "vault.buyJunior": "Buy junior (~{{cost}} CSPR)",
    "vault.lastSeniorBuy": "Last senior buy ({{amount}}):",
    "vault.lastJuniorBuy": "Last junior buy ({{amount}}):",
    "vault.seniorInputLabel": "Senior amount in CSPR",
    "vault.juniorInputLabel": "Junior amount in CSPR",

    "climax.title": "The climax — Default and slashing",
    "climax.description":
      "mark_default → waterfall → slash on whichever underwriter underpriced the risk → penalize/reward in Reputation. Each step is a real testnet transaction.",
    "climax.slashingTooltip":
      "Slashing means the protocol itself seizes part of an underwriter's staked CSPR as a penalty — no human decides this, it's a smart contract rule that fires automatically when an on-chain check proves the agent mispriced risk.",
    "climax.lossInputLabel": "Loss amount in CSPR",
    "climax.markDefault": "Mark default (~{{cost}} CSPR)",
    "climax.resultHeading": "underwriter_B underpriced the risk — slashed",
    "climax.slashDetail": "of its stake, seized after the default",
    "climax.runContext": "Run of {{date}} · B had quoted {{spread}} against a {{market}} market spread",
    "climax.reputationB": "reputation (B)",
    "climax.reputationA": "reputation (A)",
    "climax.lossMarked": "loss marked: {{amount}}",
    "climax.emptyState":
      "Run both underwriters for this asset before marking the default (the slash is calculated from B's real quoted spread).",
    "climax.constitutionTest":
      "Constitution check (direct call to assert_within_exposure): request {{amount}} of exposure → {{result}} ({{error}})",
    "climax.constitutionNote":
      "In the contracts this page reads (July 2026), stake and the tranche purchases didn't call this check yet; the 4 Sep 2026 redeploy wires it in.",
    "climax.reverted": "reverted as expected",
    "climax.notReverted": "did NOT revert (bug)",

    "feed.title": "On-chain attestation feed",
    "feed.description": "Rebuilt from agents/run-log.json — every entry is a real transaction confirmed on CSPR.live.",
    "feed.empty": "No runs logged yet.",
    "feed.loading": "Loading the run log…",
    "feed.error": "Couldn't load the run log (agents/run-log.json). Press Refresh to try again.",
    "feed.x402Settled": "x402 payment settled",
    "feed.x402Detail": "Risk data for {{assetId}}",
    "feed.quoteIssued": "Quote issued: {{rating}}/1000",
    "feed.quoteDetail": "{{tranche}} tranche · spread {{spread}}",
    "feed.stakeDeposited": "Stake deposited",
    "feed.stakeDetail": "{{amount}} staked against its own quote",
    "feed.boughtTranche": "Bought {{tranche}} tranche",
    "feed.boughtDetail": "{{amount}} committed",
    "feed.exposureProtected": "Constitution check reverted (as expected)",
    "feed.exposureNotReverted": "Constitution did NOT revert",
    "feed.exposureDetail": "Direct call · requested {{amount}} · {{error}}",
    "feed.defaultMarked": "Default marked — waterfall executed",
    "feed.defaultDetail": "Loss of {{amount}} marked (demo input)",
    "feed.slashed": "underwriter_B slashed ({{pct}}%)",
    "feed.slashedDetail": "Underpriced the risk — stake seized",
    "feed.reputationUpdated": "Reputation updated",
    "feed.reputationDetail": "B −{{penalize}} · A +{{reward}}",

    "footer.disclaimer":
      "Stakes, reputation and tranche balances are read live from Casper Testnet; the feed comes from agents/run-log.json, where every entry is a transaction already confirmed on testnet. The invoice batch, its risk data and the loss amount are demo inputs, and testnet CSPR has no real value.",
    "readOnly.tooltip":
      "Run locally to enable actions — this Vercel deploy is read-only (it can't sign transactions or run agents).",

    "wait.single.0": "Signing and sending the deploy to Casper Testnet…",
    "wait.single.15": "Waiting for block confirmation (~2 min typical)…",
    "wait.single.60": "The node is still processing — this is normal on testnet…",
    "wait.single.120": "Taking longer than usual, but still in progress — don't close this tab…",
    "wait.underwriter.0": "Paying x402 and quoting with Gemini…",
    "wait.underwriter.45": "The LLM looks saturated — retrying automatically…",
    "wait.underwriter.130": "Still saturated — trying a backup model (same output, no action needed)…",
    "wait.underwriter.170": "Signing stake and attestation on Casper Testnet…",
    "wait.demo.0": "Starting the full arc: 2 underwriters, investor and servicer…",
    "wait.demo.20": "Underwriters paying x402 and quoting with real Gemini…",
    "wait.demo.60": "Signing stakes and attestations on Testnet…",
    "wait.demo.150": "Investor buying senior/junior tranches…",
    "wait.demo.240": "Running the climax: mark_default → slash → penalize/reward…",
    "wait.demo.360": "Wrapping up the arc — can take up to ~10 min total…",

    "nav.goToSection": "Go to section {{n}}",
    "action.underwriterA": "Underwriter A",
    "action.underwriterB": "Underwriter B",
    "action.buySenior": "Buy senior",
    "action.buyJunior": "Buy junior",
    "action.markDefault": "Mark default",
    "action.demoRun": "demo:run",
    "action.success": "SUCCESS",
    "action.checkConsole": "Check console / stdout",
    "action.unknownError": "Unknown error",
    "action.reason.readOnly": "This deploy is read-only — run the project locally to use the action buttons.",
    "action.reason.tunnelDisabled": "Disabled on the public demo — run the individual actions instead (A → B → buy → default).",
    "action.reason.concurrentLock": "Another action is running right now on this demo — wait a few seconds and retry.",
    "action.reason.cooldown": "Wait {{time}} (anti-drain cooldown).",
    "action.reason.hourlyCap": "Hourly action limit reached on the public demo — try again later, or run it locally.",

    "runItYourself.title": "Run it yourself",
    "runItYourself.thesis":
      "This page is read-only. Run locally, the action buttons sign with the agent wallets in /keys — that's the thesis, the agents are the ones who sign. To run it with your own keys:",
    "runItYourself.step1": "Clone the repo and copy the .env.example files (root, x402-service, frontend).",
    "runItYourself.step2":
      "Generate your own wallets (agents/keygen.js) and fund them from the Casper testnet faucet.",
    "runItYourself.step3": "Fill in GEMINI_API_KEY and the contract hashes, install deps in /agents, /x402-service and /frontend.",
    "runItYourself.step4": "Start the x402 facilitator, run agents/demo-run.mjs or npm run dev in /frontend — action buttons sign with your keys.",
    "runItYourself.repoLink": "GitHub repo",
    "runItYourself.faucetLink": "Casper testnet faucet",
    "runItYourself.contractsTitle": "Contracts this page reads (Casper Testnet)",
    "runItYourself.redeployedTitle":
      "Redeployed 4 Sep 2026 with the Constitution check wired in — no agent activity on them yet:",

    "tx.copyHash": "Copy hash: {{hash}}",
    "tx.copied": "Copied to clipboard",
    "tx.openExplorer": "Open on CSPR.live: {{hash}}",
    "tx.openExplorerShort": "Open transaction {{hash}} on CSPR.live",

    "guide.hint.underwriters": "Start here: run Underwriter A to see it quote live",
    "guide.hint.vault": "Now: buy into the senior or junior tranche as the investor",
    "guide.hint.climax": "Finally: mark the default and watch the slash happen live",
  },
  es: {
    "header.tagline": "Mesa de titularización autónoma para la economía de agentes",
    "header.liveBadge": "Casper Testnet — datos en vivo",
    "header.refresh": "Refrescar",
    "header.refreshing": "Leyendo cadena…",
    "header.stat.totalStake": "Stake total (en vivo)",
    "header.stat.avgReputation": "Reputación promedio",
    "header.stat.events": "Eventos on-chain registrados",
    "header.stat.lastRead": "Última lectura",
    "header.readOnlyBanner":
      "Vitrina de solo lectura (Vercel): las cifras de arriba se leen en vivo de Casper Testnet. Los botones de acción solo funcionan corriendo el proyecto localmente con tus propias llaves.",

    "hero.headlinePre": "Los underwriters de IA que",
    "hero.headlineEmphasis": "sangran",
    "hero.headlinePost": "cuando se equivocan.",
    "hero.subcopyPre":
      "Dos agentes de IA cotizan el mismo lote de facturas de demostración — cada uno compra datos de riesgo vía x402, cotiza con un LLM (Gemini) y apuesta su propio CSPR de testnet detrás de su decisión. Cuando el lote cae en impago, el agente que sub-cotizó el riesgo recibe un",
    "hero.subcopyEmphasis": "slash on-chain",
    "hero.subcopyPost":
      "— pierde parte de su stake y de su reputación, a la vista de todos. Cada transacción de abajo es real en Casper Testnet y se puede verificar en CSPR.live; el lote de facturas, sus datos de riesgo y el monto de la pérdida son datos de demostración.",
    "hero.badge.x402": "Micropagos x402",
    "hero.badge.gemini": "Gemini 2.5 Flash",
    "hero.badge.casper": "Casper Testnet",
    "tooltip.whatIs": "Qué es {{term}}",
    "tooltip.x402":
      "x402 es un protocolo de pago nativo de HTTP: un agente paga una pequeña cantidad de cripto por cada llamada a una API para desbloquear una respuesta paga — sin cuentas, sin facturas, solo un 402 Payment Required manejado automáticamente.",

    "step1.title": "Activo en demo",
    "step1.description": "Los datos de riesgo de este ID los vende por x402 el propio /x402-service del proyecto (valores fijos de demostración por activo).",
    "step1.assetIdLabel": "ID del activo",
    "step1.runFullDemo": "Correr demo:run completo (~{{cost}} CSPR, varios minutos)",
    "step1.disabledPublicTooltip":
      "Deshabilitado en la demo pública (~180 CSPR, varios minutos) — usa las acciones individuales de abajo, o clona el repo para correrlo tú mismo.",
    "error.chainStateRetrying":
      "No se pudo leer Casper Testnet: el nodo RPC público está fallando. Reintentando automáticamente — el feed no depende de él.",
    "error.chainStateGaveUp":
      "El RPC público de Casper Testnet no respondió tras varios intentos, así que el stake y los saldos en vivo no están disponibles ahora. El feed sigue cargando del registro de corridas confirmadas. Pulsa Refrescar para intentar de nuevo.",

    "arena.title": "Underwriters compitiendo",
    "arena.description":
      "Dos agentes compran datos de riesgo por x402, cotizan con Gemini y apuestan CSPR de testnet detrás de su propia decisión.",
    "arena.spreadDiscrepancy": "Discrepancia de spread:",
    "arena.noRiskDataNote":
      "Estas últimas cotizaciones ({{date}}) se hicieron sin datos de riesgo: el pago x402 revertía en el contrato WCSPR compartido de testnet, así que los agentes cotizaron a ciegas. Las corridas anteriores con datos de riesgo pagados por x402 están en el feed.",

    "underwriter.conservative": "Conservador",
    "underwriter.aggressive": "Agresivo / Optimista",
    "underwriter.atStake": "en juego",
    "underwriter.sliced": "Penalizado (slash) — stake y reputación castigados",
    "underwriter.latestQuote": "Última cotización — {{assetId}} · {{date}}",
    "underwriter.noRiskData": "Sin datos de riesgo en esta corrida (el pago x402 no se liquidó).",
    "underwriter.recommendedTranche": "Tramo recomendado",
    "underwriter.quotedSpread": "Spread cotizado",
    "underwriter.feedPd": "PD del feed",
    "underwriter.marketSpread": "Spread del mercado",
    "underwriter.noRunsYet": "Corre este agente para verlo cotizar en vivo.",
    "underwriter.stakeLabel": "Stake en UnderwriterStake (en vivo)",
    "underwriter.stakeTooltip":
      "CSPR que este agente bloqueó en el contrato UnderwriterStake como colateral detrás de su propia cotización de riesgo. Solo lo recupera si el activo se comporta bien — si cae en default y este agente se equivocó, el slashing le confisca una parte.",
    "underwriter.reputationLabel": "Reputación (en vivo)",
    "underwriter.stakeInputLabel": "Monto de stake en CSPR",
    "underwriter.runButton": "Correr loop real (~{{cost}} CSPR)",

    "vault.title": "TrancheVault",
    "vault.description":
      "El activo se parte en tramos: el investor compra senior (protegido, paga primero) o junior (absorbe pérdidas primero, mayor rendimiento) — en vivo, leído on-chain.",
    "vault.seniorLabel": "Tramo senior",
    "vault.seniorSub": "Bajo riesgo · paga primero",
    "vault.seniorTooltip":
      "La porción protegida del acuerdo. Los tenedores senior cobran primero de lo que sea que el activo recupere — menor rendimiento, pero las pérdidas solo los alcanzan después de que el tramo junior queda agotado.",
    "vault.juniorLabel": "Tramo junior",
    "vault.juniorSub": "Alto riesgo · absorbe pérdidas primero",
    "vault.juniorTooltip":
      "La porción riesgosa. Los tenedores junior absorben las pérdidas primero si el activo cae en default — a cambio, ganan un rendimiento mayor que el senior. Este es el tramo que el underwriter agresivo (B) suele empujar.",
    "vault.faceValue": "{{amount}} nominal",
    "vault.outstanding": "outstanding (en vivo)",
    "vault.wiped": "Tramo agotado por el waterfall",
    "vault.investorAgent": "Investor Agent",
    "vault.holdingsPrefix": "Holdings en vivo: senior",
    "vault.holdingsMiddle": "· junior",
    "vault.buySenior": "Comprar senior (~{{cost}} CSPR)",
    "vault.buyJunior": "Comprar junior (~{{cost}} CSPR)",
    "vault.lastSeniorBuy": "Última compra senior ({{amount}}):",
    "vault.lastJuniorBuy": "Última compra junior ({{amount}}):",
    "vault.seniorInputLabel": "Monto senior en CSPR",
    "vault.juniorInputLabel": "Monto junior en CSPR",

    "climax.title": "El clímax — Default y slashing",
    "climax.description":
      "mark_default → waterfall → slash al underwriter que sub-cotizó el riesgo → penalize/reward en Reputation. Cada paso es una transacción real en testnet.",
    "climax.slashingTooltip":
      "Slashing significa que el protocolo mismo confisca parte del CSPR stakeado de un underwriter como penalidad — nadie decide esto, es una regla del smart contract que se dispara automáticamente cuando una verificación on-chain prueba que el agente se equivocó con el riesgo.",
    "climax.lossInputLabel": "Monto de pérdida en CSPR",
    "climax.markDefault": "Marcar impago (~{{cost}} CSPR)",
    "climax.resultHeading": "underwriter_B sub-cotizó el riesgo — penalizado",
    "climax.slashDetail": "de su stake, confiscado tras el impago",
    "climax.runContext": "Corrida del {{date}} · B había cotizado {{spread}} frente a un spread de mercado de {{market}}",
    "climax.reputationB": "reputación (B)",
    "climax.reputationA": "reputación (A)",
    "climax.lossMarked": "pérdida marcada: {{amount}}",
    "climax.emptyState":
      "Corre ambos underwriters para este activo antes de marcar el default (el slash se calcula del spread real que cotizó B).",
    "climax.constitutionTest":
      "Chequeo de Constitution (llamada directa a assert_within_exposure): pedir {{amount}} de exposición → {{result}} ({{error}})",
    "climax.constitutionNote":
      "En los contratos que lee esta página (julio 2026), el stake y las compras de tramos todavía no llamaban a este chequeo; el redespliegue del 4 sep 2026 ya lo conecta.",
    "climax.reverted": "revirtió como se esperaba",
    "climax.notReverted": "NO revirtió (bug)",

    "feed.title": "Feed de atestaciones on-chain",
    "feed.description": "Reconstruido de agents/run-log.json — cada entrada es una transacción real confirmada en CSPR.live.",
    "feed.empty": "Todavía no hay corridas registradas.",
    "feed.loading": "Cargando el registro de corridas…",
    "feed.error": "No se pudo cargar el registro de corridas (agents/run-log.json). Pulsa Refrescar para intentar de nuevo.",
    "feed.x402Settled": "Pago x402 liquidado",
    "feed.x402Detail": "Datos de riesgo para {{assetId}}",
    "feed.quoteIssued": "Cotización emitida: {{rating}}/1000",
    "feed.quoteDetail": "tramo {{tranche}} · spread {{spread}}",
    "feed.stakeDeposited": "Stake depositado",
    "feed.stakeDetail": "{{amount}} apostados contra su propia cotización",
    "feed.boughtTranche": "Compró tramo {{tranche}}",
    "feed.boughtDetail": "{{amount}} comprometidos",
    "feed.exposureProtected": "Chequeo de Constitution revirtió (lo esperado)",
    "feed.exposureNotReverted": "Constitution NO revirtió",
    "feed.exposureDetail": "Llamada directa · pedido {{amount}} · {{error}}",
    "feed.defaultMarked": "Default marcado — waterfall ejecutado",
    "feed.defaultDetail": "Pérdida de {{amount}} marcada (dato de demostración)",
    "feed.slashed": "underwriter_B penalizado con slash ({{pct}}%)",
    "feed.slashedDetail": "Sub-cotizó el riesgo — stake confiscado",
    "feed.reputationUpdated": "Reputación actualizada",
    "feed.reputationDetail": "B −{{penalize}} · A +{{reward}}",

    "footer.disclaimer":
      "El stake, la reputación y los saldos de los tramos se leen en vivo de Casper Testnet; el feed sale de agents/run-log.json, donde cada entrada es una transacción ya confirmada en testnet. El lote de facturas, sus datos de riesgo y el monto de la pérdida son datos de demostración, y el CSPR de testnet no tiene valor real.",
    "readOnly.tooltip":
      "Corre localmente para acciones — este deploy en Vercel es solo lectura (no puede firmar transacciones ni correr agentes).",
    "header.liveDemoBanner": "Ver la demo interactiva en vivo",

    "budget.remaining": "Presupuesto de demo restante: ~{{amount}} (balance real)",
    "budget.hourlyCap": "{{used}}/{{cap}} acciones esta hora",
    "budget.cooldown": "Cooldown: {{seconds}}s para la próxima acción",

    "wait.single.0": "Firmando y enviando el deploy a Casper Testnet…",
    "wait.single.15": "Esperando confirmación de bloque (~2 min típico)…",
    "wait.single.60": "El nodo sigue procesando — esto es normal en testnet…",
    "wait.single.120": "Tardando más de lo usual, pero sigue en curso — no cierres esta pestaña…",
    "wait.underwriter.0": "Pagando x402 y cotizando con Gemini…",
    "wait.underwriter.45": "El LLM parece saturado — reintentando automáticamente…",
    "wait.underwriter.130": "Sigue saturado — probando un modelo de respaldo (mismo resultado, no requiere acción)…",
    "wait.underwriter.170": "Firmando stake y atestación en Casper Testnet…",
    "wait.demo.0": "Arrancando el arco completo: 2 underwriters, investor y servicer…",
    "wait.demo.20": "Underwriters pagando x402 y cotizando con Gemini real…",
    "wait.demo.60": "Firmando stakes y atestaciones en Testnet…",
    "wait.demo.150": "Investor comprando tramos senior/junior…",
    "wait.demo.240": "Ejecutando el clímax: mark_default → slash → penalize/reward…",
    "wait.demo.360": "Cerrando el arco — puede tardar hasta ~10 min en total…",

    "nav.goToSection": "Ir a la sección {{n}}",
    "action.underwriterA": "Underwriter A",
    "action.underwriterB": "Underwriter B",
    "action.buySenior": "Comprar senior",
    "action.buyJunior": "Comprar junior",
    "action.markDefault": "Marcar default",
    "action.demoRun": "demo:run",
    "action.success": "SUCCESS",
    "action.checkConsole": "Revisa la consola / stdout",
    "action.unknownError": "Error desconocido",
    "action.reason.readOnly": "Este deploy es de solo lectura — corre el proyecto localmente para usar los botones de acción.",
    "action.reason.tunnelDisabled": "Deshabilitado en la demo pública — usa las acciones individuales (A → B → comprar → default).",
    "action.reason.concurrentLock": "Otra acción está en curso ahora mismo en esta demo — espera unos segundos y reintenta.",
    "action.reason.cooldown": "Espera {{time}} (cooldown anti-drenaje).",
    "action.reason.hourlyCap": "Tope de acciones por hora alcanzado en la demo pública — intenta más tarde, o corre el proyecto localmente.",

    "runItYourself.title": "Corre esto tú mismo",
    "runItYourself.thesis":
      "Esta página es de solo lectura. Corriendo localmente, los botones de acción firman con las wallets de los agentes en /keys — esa es la tesis, los agentes son los que firman. Para correrlo con tus propias llaves:",
    "runItYourself.step1": "Clona el repo y copia los .env.example (raíz, x402-service, frontend).",
    "runItYourself.step2": "Genera tus propias wallets (agents/keygen.js) y fondéalas desde el faucet de Casper testnet.",
    "runItYourself.step3": "Llena GEMINI_API_KEY y los hashes de contratos, instala deps en /agents, /x402-service y /frontend.",
    "runItYourself.step4": "Arranca el facilitator x402, corre agents/demo-run.mjs o npm run dev en /frontend — los botones firman con tus llaves.",
    "runItYourself.repoLink": "Repo en GitHub",
    "runItYourself.faucetLink": "Faucet de Casper testnet",
    "runItYourself.contractsTitle": "Contratos que lee esta página (Casper Testnet)",
    "runItYourself.redeployedTitle":
      "Redesplegados el 4 sep 2026 con el chequeo de Constitution conectado — todavía sin actividad de los agentes:",

    "tx.copyHash": "Copiar hash: {{hash}}",
    "tx.copied": "Copiado al portapapeles",
    "tx.openExplorer": "Ver en CSPR.live: {{hash}}",
    "tx.openExplorerShort": "Abrir la transacción {{hash}} en CSPR.live",

    "guide.hint.underwriters": "Empieza aquí: corre Underwriter A para verlo cotizar en vivo",
    "guide.hint.vault": "Ahora: compra el tramo senior o junior como investor",
    "guide.hint.climax": "Por último: marca el default y mira el slash en vivo",
  },
} as const;

export type Locale = keyof typeof dictionary;
export type TranslationKey = keyof (typeof dictionary)["en"];

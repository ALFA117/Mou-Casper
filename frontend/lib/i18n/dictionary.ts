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
      "Read-only showcase (Vercel) — the numbers above are real and live. Run the project locally to trigger actions that spend CSPR.",
    "header.liveDemoBanner": "Try the live interactive demo",

    "budget.remaining": "Demo budget remaining: ~{{amount}} (real balance)",
    "budget.hourlyCap": "{{used}}/{{cap}} actions this hour",
    "budget.cooldown": "Cooldown: {{seconds}}s until the next action",

    "hero.headlinePre": "AI underwriters that",
    "hero.headlineEmphasis": "bleed",
    "hero.headlinePost": "when they're wrong.",
    "hero.subcopyPre":
      "Two AI agents underwrite the same real-world invoice batch — each pays for risk data, quotes it with a live LLM, and stakes its own CSPR behind the call. When the batch defaults, whichever agent mispriced the risk gets",
    "hero.subcopyEmphasis": "sliced on-chain",
    "hero.subcopyPost":
      "— stake seized, reputation destroyed, in front of everyone. Nothing below is simulated: every transaction is verifiable right now on Casper Testnet.",
    "hero.badge.x402": "x402 micropayments",
    "hero.badge.gemini": "Gemini 2.5 Flash",
    "hero.badge.casper": "Casper Testnet",
    "tooltip.whatIs": "What is {{term}}",
    "tooltip.x402":
      "x402 is an HTTP-native payment protocol: an agent pays a tiny amount of crypto per API call to unlock a paid response — no accounts, no invoices, just a 402 Payment Required handled automatically.",

    "step1.title": "Demo asset",
    "step1.description": "Real risk data is purchased via x402 from /x402-service for this ID.",
    "step1.assetIdLabel": "Asset ID",
    "step1.runFullDemo": "Run full demo:run (~{{cost}} CSPR, several minutes)",
    "step1.disabledPublicTooltip":
      "Disabled on the public demo (~180 CSPR, several minutes) — run the individual actions below instead, or clone the repo to run it yourself.",
    "error.chainStateRead": "Could not read on-chain state: {{error}}",

    "arena.title": "Underwriters competing",
    "arena.description":
      "Two agents pay real x402 for risk data, quote it with real Gemini, and stake real CSPR behind their own call.",
    "arena.spreadDiscrepancy": "Spread discrepancy:",

    "underwriter.conservative": "Conservative",
    "underwriter.aggressive": "Aggressive / Optimistic",
    "underwriter.atStake": "at stake",
    "underwriter.sliced": "Sliced — stake and reputation punished",
    "underwriter.latestQuote": "Latest quote — {{assetId}}",
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
      "mark_default → waterfall → slash on whichever underwriter underpriced the risk → penalize/reward in Reputation. All real.",
    "climax.slashingTooltip":
      "Slashing means the protocol itself seizes part of an underwriter's staked CSPR as a penalty — no human decides this, it's a smart contract rule that fires automatically when an on-chain check proves the agent mispriced risk.",
    "climax.lossInputLabel": "Loss amount in CSPR",
    "climax.markDefault": "Mark default (~{{cost}} CSPR)",
    "climax.resultHeading": "underwriter_B underpriced the risk — sliced",
    "climax.slashDetail": "of its stake, seized by the waterfall",
    "climax.reputationB": "reputation (B)",
    "climax.reputationA": "reputation (A)",
    "climax.lossMarked": "loss marked: {{amount}}",
    "climax.emptyState":
      "Run both underwriters for this asset before marking the default (the slash is calculated from B's real quoted spread).",
    "climax.constitutionTest":
      "Constitution test: request {{amount}} of exposure → {{result}} ({{error}})",
    "climax.reverted": "reverted as expected",
    "climax.notReverted": "did NOT revert (bug)",

    "feed.title": "On-chain attestation feed",
    "feed.description": "Rebuilt from agents/run-log.json — every entry is a real transaction confirmed on CSPR.live.",
    "feed.empty": "No on-chain activity yet — trigger an action above to see it appear here.",
    "feed.x402Settled": "x402 payment settled",
    "feed.x402Detail": "Risk data for {{assetId}}",
    "feed.quoteIssued": "Quote issued: {{rating}}/1000",
    "feed.quoteDetail": "{{tranche}} tranche · spread {{spread}}",
    "feed.stakeDeposited": "Stake deposited",
    "feed.stakeDetail": "{{amount}} staked against its own quote",
    "feed.boughtTranche": "Bought {{tranche}} tranche",
    "feed.boughtDetail": "{{amount}} committed",
    "feed.exposureProtected": "Exposure limit protected (reverted)",
    "feed.exposureNotReverted": "Constitution did NOT revert",
    "feed.exposureDetail": "Requested: {{amount}} · {{error}}",
    "feed.defaultMarked": "Default marked — waterfall executed",
    "feed.defaultDetail": "Simulated loss of {{amount}}",
    "feed.slashed": "underwriter_B sliced ({{pct}}%)",
    "feed.slashedDetail": "Underpriced the risk — stake seized",
    "feed.reputationUpdated": "Reputation updated",
    "feed.reputationDetail": "B −{{penalize}} · A +{{reward}}",

    "footer.disclaimer":
      "All figures are read live from Casper Testnet or agents/run-log.json (already-confirmed real transactions) — nothing on this page is simulated or calculated locally without on-chain backing.",
    "readOnly.tooltip":
      "Run locally to enable actions — this Vercel deploy is read-only (it can't sign transactions or run agents).",

    "wait.single.0": "Signing and sending the deploy to Casper Testnet…",
    "wait.single.15": "Waiting for block confirmation (~2 min typical)…",
    "wait.single.60": "The node is still processing — this is normal on testnet…",
    "wait.single.120": "Taking longer than usual, but still in progress — don't close this tab…",
    "wait.demo.0": "Starting the full arc: 2 underwriters, investor and servicer…",
    "wait.demo.20": "Underwriters paying x402 and quoting with real Gemini…",
    "wait.demo.60": "Signing stakes and attestations on Testnet…",
    "wait.demo.150": "Investor buying senior/junior tranches…",
    "wait.demo.240": "Running the climax: mark_default → slash → penalize/reward…",
    "wait.demo.360": "Wrapping up the arc — can take up to ~10 min total…",

    "error.readingChain": "Error reading on-chain state",
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
    "action.reason.tunnelDisabled": "Disabled on the public demo — run the individual actions instead (A → B → buy → default).",
    "action.reason.concurrentLock": "Another action is running right now on this demo — wait a few seconds and retry.",
    "action.reason.cooldown": "Wait {{time}} (anti-drain cooldown).",
    "action.reason.hourlyCap": "Hourly action limit reached on the public demo — try again later, or run it locally.",

    "runItYourself.title": "Run it yourself",
    "runItYourself.thesis":
      "This live demo signs with the project's own agent wallets — that's the thesis, agents are the ones who sign. To operate with your own keys, clone it like this:",
    "runItYourself.step1": "Clone the repo and copy the .env.example files (root, x402-service, frontend).",
    "runItYourself.step2":
      "Generate your own wallets (agents/keygen.js) and fund them from the Casper testnet faucet.",
    "runItYourself.step3": "Fill in GEMINI_API_KEY and the contract hashes, install deps in /agents, /x402-service and /frontend.",
    "runItYourself.step4": "Start the x402 facilitator, run agents/demo-run.mjs or npm run dev in /frontend — action buttons sign with your keys.",
    "runItYourself.repoLink": "GitHub repo",
    "runItYourself.faucetLink": "Casper testnet faucet",
    "runItYourself.contractsTitle": "Deployed contracts (Casper Testnet)",

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
      "Vitrina de solo lectura (Vercel) — los números de arriba son reales y en vivo. Corre el proyecto localmente para disparar acciones que gastan CSPR.",

    "hero.headlinePre": "Los underwriters de IA que",
    "hero.headlineEmphasis": "sangran",
    "hero.headlinePost": "cuando se equivocan.",
    "hero.subcopyPre":
      "Dos agentes de IA cotizan el mismo batch real de facturas — cada uno paga por datos de riesgo, cotiza con un LLM en vivo, y apuesta su propio CSPR detrás de su decisión. Cuando el batch cae en default, el agente que sub-cotizó el riesgo queda",
    "hero.subcopyEmphasis": "rebanado on-chain",
    "hero.subcopyPost":
      "— su stake es confiscado, su reputación destruida, frente a todos. Nada de esto está simulado: cada transacción es verificable ahora mismo en Casper Testnet.",
    "hero.badge.x402": "Micropagos x402",
    "hero.badge.gemini": "Gemini 2.5 Flash",
    "hero.badge.casper": "Casper Testnet",
    "tooltip.whatIs": "Qué es {{term}}",
    "tooltip.x402":
      "x402 es un protocolo de pago nativo de HTTP: un agente paga una pequeña cantidad de cripto por cada llamada a una API para desbloquear una respuesta paga — sin cuentas, sin facturas, solo un 402 Payment Required manejado automáticamente.",

    "step1.title": "Activo en demo",
    "step1.description": "Los datos de riesgo reales se compran vía x402 a /x402-service para este ID.",
    "step1.assetIdLabel": "ID del activo",
    "step1.runFullDemo": "Correr demo:run completo (~{{cost}} CSPR, varios minutos)",
    "step1.disabledPublicTooltip":
      "Deshabilitado en la demo pública (~180 CSPR, varios minutos) — usa las acciones individuales de abajo, o clona el repo para correrlo tú mismo.",
    "error.chainStateRead": "No se pudo leer el estado on-chain: {{error}}",

    "arena.title": "Underwriters compitiendo",
    "arena.description":
      "Dos agentes pagan x402 real por datos de riesgo, cotizan con Gemini real, y apuestan CSPR real detrás de su propio call.",
    "arena.spreadDiscrepancy": "Discrepancia de spread:",

    "underwriter.conservative": "Conservador",
    "underwriter.aggressive": "Agresivo / Optimista",
    "underwriter.atStake": "en juego",
    "underwriter.sliced": "Rebanado — stake y reputación castigados",
    "underwriter.latestQuote": "Última cotización — {{assetId}}",
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
      "mark_default → waterfall → slash sobre el underwriter que sobre-cotizó → penalize/reward en Reputation. Todo real.",
    "climax.slashingTooltip":
      "Slashing significa que el protocolo mismo confisca parte del CSPR stakeado de un underwriter como penalidad — nadie decide esto, es una regla del smart contract que se dispara automáticamente cuando una verificación on-chain prueba que el agente se equivocó con el riesgo.",
    "climax.lossInputLabel": "Monto de pérdida en CSPR",
    "climax.markDefault": "Marcar impago (~{{cost}} CSPR)",
    "climax.resultHeading": "underwriter_B sobre-cotizó el riesgo — rebanado",
    "climax.slashDetail": "de su stake, seizado por el waterfall",
    "climax.reputationB": "reputación (B)",
    "climax.reputationA": "reputación (A)",
    "climax.lossMarked": "pérdida marcada: {{amount}}",
    "climax.emptyState":
      "Corre ambos underwriters para este activo antes de marcar el default (el slash se calcula del spread real que cotizó B).",
    "climax.constitutionTest":
      "Prueba de Constitution: pedir {{amount}} de exposición → {{result}} ({{error}})",
    "climax.reverted": "revirtió como se esperaba",
    "climax.notReverted": "NO revirtió (bug)",

    "feed.title": "Feed de atestaciones on-chain",
    "feed.description": "Reconstruido de agents/run-log.json — cada entrada es una transacción real confirmada en CSPR.live.",
    "feed.empty": "Sin actividad on-chain todavía — dispara una acción arriba para verla aquí.",
    "feed.x402Settled": "Pago x402 liquidado",
    "feed.x402Detail": "Datos de riesgo para {{assetId}}",
    "feed.quoteIssued": "Cotización emitida: {{rating}}/1000",
    "feed.quoteDetail": "tramo {{tranche}} · spread {{spread}}",
    "feed.stakeDeposited": "Stake depositado",
    "feed.stakeDetail": "{{amount}} apostados contra su propia cotización",
    "feed.boughtTranche": "Compró tramo {{tranche}}",
    "feed.boughtDetail": "{{amount}} comprometidos",
    "feed.exposureProtected": "Límite de exposición protegido (revirtió)",
    "feed.exposureNotReverted": "Constitution NO revirtió",
    "feed.exposureDetail": "Pedido: {{amount}} · {{error}}",
    "feed.defaultMarked": "Default marcado — waterfall ejecutado",
    "feed.defaultDetail": "Pérdida simulada de {{amount}}",
    "feed.slashed": "underwriter_B slasheado ({{pct}}%)",
    "feed.slashedDetail": "Sobre-cotizó el riesgo — stake seizado",
    "feed.reputationUpdated": "Reputación actualizada",
    "feed.reputationDetail": "B −{{penalize}} · A +{{reward}}",

    "footer.disclaimer":
      "Todas las cifras son leídas en vivo de Casper Testnet o de agents/run-log.json (transacciones reales ya confirmadas) — nada en esta página está simulado ni calculado localmente sin respaldo on-chain.",
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
    "wait.demo.0": "Arrancando el arco completo: 2 underwriters, investor y servicer…",
    "wait.demo.20": "Underwriters pagando x402 y cotizando con Gemini real…",
    "wait.demo.60": "Firmando stakes y atestaciones en Testnet…",
    "wait.demo.150": "Investor comprando tramos senior/junior…",
    "wait.demo.240": "Ejecutando el clímax: mark_default → slash → penalize/reward…",
    "wait.demo.360": "Cerrando el arco — puede tardar hasta ~10 min en total…",

    "error.readingChain": "Error leyendo estado on-chain",
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
    "action.reason.tunnelDisabled": "Deshabilitado en la demo pública — usa las acciones individuales (A → B → comprar → default).",
    "action.reason.concurrentLock": "Otra acción está en curso ahora mismo en esta demo — espera unos segundos y reintenta.",
    "action.reason.cooldown": "Espera {{time}} (cooldown anti-drenaje).",
    "action.reason.hourlyCap": "Tope de acciones por hora alcanzado en la demo pública — intenta más tarde, o corre el proyecto localmente.",

    "runItYourself.title": "Corre esto tú mismo",
    "runItYourself.thesis":
      "Esta demo en vivo firma con los wallets de los agentes del proyecto — esa es la tesis, los agentes son los que firman. Para operar con tus propias llaves, clónalo así:",
    "runItYourself.step1": "Clona el repo y copia los .env.example (raíz, x402-service, frontend).",
    "runItYourself.step2": "Genera tus propias wallets (agents/keygen.js) y fondéalas desde el faucet de Casper testnet.",
    "runItYourself.step3": "Llena GEMINI_API_KEY y los hashes de contratos, instala deps en /agents, /x402-service y /frontend.",
    "runItYourself.step4": "Arranca el facilitator x402, corre agents/demo-run.mjs o npm run dev en /frontend — los botones firman con tus llaves.",
    "runItYourself.repoLink": "Repo en GitHub",
    "runItYourself.faucetLink": "Faucet de Casper testnet",
    "runItYourself.contractsTitle": "Contratos deployados (Casper Testnet)",

    "guide.hint.underwriters": "Empieza aquí: corre Underwriter A para verlo cotizar en vivo",
    "guide.hint.vault": "Ahora: compra el tramo senior o junior como investor",
    "guide.hint.climax": "Por último: marca el default y mira el slash en vivo",
  },
} as const;

export type Locale = keyof typeof dictionary;
export type TranslationKey = keyof (typeof dictionary)["en"];

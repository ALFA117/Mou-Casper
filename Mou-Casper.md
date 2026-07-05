# MOU CASPER — Prompt Maestro / Build Brief

> **Cómo usar este archivo:** guárdalo en la lap y pégalo (o dáselo como contexto) a tu IA de código
> (Claude Code, Cursor, etc.). Es la fuente de verdad del proyecto. La IA debe leerlo completo
> antes de escribir una sola línea, y construir en los pasos de la Sección 10.
>
> **Nombre del proyecto:** codename `AVAL` (renómbralo cuando quieras; el nombre no cambia nada del código).

---

## 0. INSTRUCCIONES PARA LA IA (rol y modo de trabajo)

Eres un ingeniero senior de blockchain + IA. Vas a construir, de principio a fin, un proyecto para el
**Casper Agentic Buildathon 2026** con un desarrollador que trabaja solo y tiene ~6 días. Reglas de trabajo:

1. **Lee TODO este documento antes de codear.** No asumas capacidades del toolkit: valídalas contra los links de la Sección 9.
2. **Trabaja en pasos discretos** (Sección 10). Al terminar cada paso, detente, resume qué hiciste, y **valida con una transacción real en Casper Testnet** antes de seguir. Nada de avanzar 5 pasos sin probar.
3. **Prioridad #1 innegociable:** contratos funcionando en Testnet con transacciones on-chain reales. Una idea bonita sin demo funcional PIERDE. Si algo amenaza la demo, recórtalo.
4. **No dependas de liquidez de DEX en testnet** — puede no existir y ha reventado demos. El core del producto no la necesita.
5. **Resuelve el bug de pricing mode el DÍA 1** (Sección 6) antes de escribir lógica de negocio.
6. **Pregunta antes de decisiones grandes** (versión de Odra, estructura de tramos, esquema de slashing). Para lo pequeño, decide y avanza.
7. **Alcance recortado > alcance grande.** Sigue la Sección 7 al pie de la letra. La visión ambiciosa es para el pitch; el MVP es lo que se entrega.
8. **Deja medio día de colchón** al final. Los deploys de última hora fallan.
9. Escribe código limpio, comentado, y un **README con documentación + walkthrough** (requisito de entrega).
10. Todo el código y contenido debe ser **original y nuevo** para el buildathon (regla anti-plagio).

---

## 1. CONTEXTO DEL HACKATHON

- **Evento:** Casper Agentic Buildathon 2026 — Qualification Round. Organiza Casper Association, plataforma DoraHacks.
- **Deadline (extendido):** **7 de julio de 2026, 17:59.** Hoy es ~1 de julio → quedan ~6 días.
- **Track único:** Casper Innovation Track = Agentic AI + DeFi + RWA sobre Casper. Se premia con énfasis el **Agentic AI** aplicado a problemas reales.
- **Premios:** $150,000 total ($30k cash + $100k créditos ecosistema x402 + $20k en especie).
- **Requisitos de entrega (obligatorios):**
  - Prototipo funcional en **Casper Testnet** con componente on-chain que **produce transacciones**.
  - Repo open-source (GitHub/GitLab/Bitbucket) con README documentado.
  - Video demo público con walkthrough.
- **Dos caminos a la final:**
  - **(A) Voto comunitario** en la app **CSPR.fans** → top 3 pasan directo, sin jurado. (Cualquiera puede votar, no solo hackers.)
  - **(B) Builder-merit** → si el prototipo cumple criterios técnicos (funciona en testnet con tx on-chain), avanza a evaluación de jurado. **Este es nuestro seguro garantizado.**
- **Criterios de jurado (final):** Ejecución técnica · Innovación/Originalidad · Uso de IA/Agentic · Aplicabilidad real (DeFi/RWA) · UX/Diseño · Smart contracts funcionando · Plan a largo plazo (socials + deployment) · Impacto en el ecosistema.
- **Soporte real:** Telegram `CSPR Developers` → https://t.me/CSPRDevelopers (responde el organizador, no solo el bot).

---

## 2. EL HUECO COMPETITIVO (por qué esta idea)

Ya hay ~110 proyectos subidos. Zonas **saturadas** (NO entrar): oráculos/verifiable RWA data (~25), rieles de pago x402 / wallets de agente (~30), vault/portfolio "guardian" con guardrails (~20). Muchos solo hacen "el agente escribe su razonamiento on-chain".

Zonas **casi vacías** (el oro): mercados de capital para agentes, **reaseguro / tranching de riesgo**, y **securitización de flujos RWA** — prácticamente nadie.

**El mecanismo original que nadie más tiene:** el agente **apuesta su propio capital contra su propia opinión**, y el protocolo lo **castiga económicamente (slashing)** cuando se equivoca. Pasa de "confía en mi IA" a "mi IA sangra si miente". Es la tesis del Casper Manifest (Casper = capa de confianza de la economía de agentes y los RWA regulados) hecha producto.

---

## 3. EL PRODUCTO: AVAL

**Pitch de una línea:** la mesa de titularización (securitization desk) autónoma para la economía de agentes.

**Qué hace:** toma un flujo de dinero del mundo real (para el MVP: **facturas / receivables**), y una manada de **agentes aseguradores de IA que ponen su propio capital en garantía** lo cotizan, lo parten en **tramos senior/junior**, lo venden a inversores, y lo monitorean —todo autónomo. Cada decisión de suscripción queda **atestiguada on-chain en Casper**. Al que cotiza mal, se le **rebana el stake** y su reputación (y su poder de fijar precio) se hunde.

**Por qué gana cada criterio:**
- Innovación → tranching + underwriting con stake es inédito en el track.
- Uso de IA/Agentic → los agentes toman decisiones económicas reales, compiten, y **pagan por datos** para cotizar.
- DeFi + RWA → es estructuración financiera de activos reales. El corazón de ambos temas.
- Smart contracts → vault de tramos + atestación + reputación/slashing = tx reales garantizadas.
- UX → dashboard donde ves a los agentes cotizar, apostar y —en el clímax— ser rebanados.
- Impacto → securitización on-chain automatizada es un mercado de billones; refuerza el ecosistema RWA de Casper.

---

## 4. ARQUITECTURA

### 4.1 Contratos on-chain (Odra 2.x, Casper Testnet)
1. **`TrancheVault`** — recibe el colateral RWA tokenizado; emite 2 tramos (senior = bajo riesgo/bajo yield; junior = alto riesgo, absorbe pérdidas primero). Implementa el waterfall de pagos.
2. **`AttestationRegistry`** — por cada suscripción guarda: rating, hash del razonamiento del LLM + razonamiento completo, feeds usados, y quién firmó.
3. **`UnderwriterStake`** — cada agente asegurador deposita CSPR. Si el activo incumple más de lo calificado, se ejecuta **slashing** proporcional.
4. **`Reputation`** — score on-chain que pondera cuánto vale la opinión de cada agente y su poder de precio.
5. **`Constitution`** (límites duros) — máx. exposición, piso de colateral, circuit breakers. **Los agentes NO pueden sobrepasarlo.** Mata el miedo de "le diste dinero real a una IA alucinada" — debilidad que el jurado castiga en los demás.

### 4.2 Agentes off-chain (aquí corren las 5 suscripciones de Claude en paralelo)
- **Underwriter Agents (2–3, compitiendo)** — reciben el activo, **pagan vía x402** por datos de riesgo, corren su modelo, emiten rating + tramo + precio, firman su stake, atestan.
- **Servicer/Monitor Agent** — vigila el cumplimiento del flujo real y dispara el waterfall / slashing.
- **(opcional) Investor Agent** — compra tramos según su apetito de riesgo (demuestra el lado comprador del mercado).

### 4.3 Mapeo al Casper AI Toolkit (usarlo TODO — el jurado lo premia)
- **x402** → los underwriters pagan por-request por feeds de riesgo; inversores pagan por el reporte. El x402 Facilitator está vivo en mainnet y **los equipos del buildathon reciben uso patrocinado (tx gratis)** para probar micropagos. Explótalo.
- **MCP** → los agentes leen estado/balances/eventos vía **Casper MCP Server**; para DeFi opcional, **CSPR.trade MCP**.
- **CSPR.click AI Agent Skill** → wallet, firma de tx, acceso a CSPR.cloud. Instalación: `claude skill install cspr-click`.
- **Odra** → los 5 contratos. Trae `llms.txt`, la IA los genera.
- **CSPR.cloud** → API REST/Streaming para el monitoreo del servicer.

---

## 5. STACK TÉCNICO Y DECISIONES
- **Contratos:** Odra (Rust/WASM) — versión **compatible con classic pricing** (ver Sección 6).
- **Agentes:** Node/TypeScript o Python. LLM vía API. Loop: percibir → pagar x402 → decidir → firmar → atestar.
- **Frontend:** Next.js, tema oscuro, un solo dashboard con el momento clímax visible.
- **Explorer:** enlaza cada tx a **CSPR.live** (testnet) para probar que es real.
- **Endpoint x402 propio:** un microservicio que devuelve "datos de riesgo de mercado" y cobra por-request; los agentes le pagan de verdad on-chain.

---

## 6. TRAMPAS TÉCNICAS CONOCIDAS (resolver DÍA 1)
- **Pricing mode / versiones:** un equipo reportó `invalid pricing mode` con Odra 2.8.1 + casper-client 5.0.0 en node build 2.2.2. **Fix:** usar versión compatible con **classic pricing** (o setear pricing mode explícito). **Valídalo antes de codear lógica.**
- **SSE events URL de testnet:** usar `https://node.testnet.casper.network/events`. Los `/events/main` de CSPR.cloud daban 401.
- **Liquidez DeFi en testnet:** puede no existir → el core NO debe depender de swaps en un DEX vivo.

---

## 7. ALCANCE MVP (lo que SÍ y lo que NO)
**SÍ (esto se entrega):**
- 1 solo tipo de RWA: facturas/receivables.
- 2 underwriters compitiendo + 1 servicer.
- 2 tramos (senior/junior). Nada más.
- 1 endpoint x402 propio con pago real on-chain.
- Slashing demostrado con **default simulado** (botón "marcar impago"). No hacen falta incumplimientos reales.
- Dashboard bonito con el clímax visible.

**NO (recortar sin culpa):**
- Swarms de 6 agentes, múltiples tipos de RWA, mercado secundario complejo, integración de DEX en vivo, mainnet.

---

## 8. LA DEMO QUE GANA (guion)
1. Subes un batch de facturas RWA → se tokeniza.
2. Los 2 underwriters **pagan x402 en vivo** por datos → cada uno emite rating y **apuesta CSPR**. Se ve la discrepancia (drama).
3. Se arma el vault: tramos senior/junior a la venta; el Investor Agent compra.
4. **Clímax:** botón "impago" → el waterfall golpea primero al junior → el underwriter que sobre-cotizó **es rebanado en vivo**, su reputación cae → todo atestiguado on-chain con link a CSPR.live.

Ese arco —IA que sangra cuando miente, verificable por cualquiera— es lo que ningún otro de los 110 puede mostrar.

---

## 9. LINKS Y RECURSOS
- Toolkit completo: https://www.casper.network/ai
- Hackathon (DoraHacks): https://dorahacks.io/hackathon/casper-agentic-buildathon/detail
- Referencia MCP-native (patrón agent-loop): https://glama.ai/mcp/servers/Lukeknow0/casper-agent-kit
- Whitepaper x402: https://www.x402.org/x402-whitepaper.pdf
- Soporte devs (Telegram): https://t.me/CSPRDevelopers
- Explorer testnet: CSPR.live · SSE events: https://node.testnet.casper.network/events

---

## 10. PASOS (lista ejecutable — la IA sigue esto en orden)

**FASE 0 — Setup (Día 1). No avanzar hasta terminar esta fase.**
1. Instala `casper-client` y toolchain de Odra en versiones **compatibles con classic pricing**. Documenta las versiones exactas en el README.
2. Instala la CSPR.click AI Agent Skill (`claude skill install cspr-click`). Crea una wallet de testnet y fondéala desde el faucet.
3. Deploya un contrato Odra trivial ("hello") a Testnet y **confirma una tx real** en CSPR.live. Si falla por pricing mode, resuélvelo AHORA.
4. Inicializa el repo (monorepo: `/contracts`, `/agents`, `/x402-service`, `/frontend`), README base, `.env.example`.

**FASE 1 — Contratos core (Días 2–3).**
5. Escribe y deploya `TrancheVault` (colateral + 2 tramos + waterfall). Prueba depósito/emisión con tx reales.
6. Escribe y deploya `AttestationRegistry` (rating + hash de razonamiento + razonamiento + firma). Prueba una atestación.
7. Escribe y deploya `UnderwriterStake` + `Reputation` + `Constitution` (límites duros). Prueba stake + un slashing manual + lectura de reputación.

**FASE 2 — Agentes (Días 3–4).**
8. Levanta tu **endpoint x402 propio** que cobra por-request y devuelve datos de riesgo. Prueba un pago x402 real end-to-end.
9. Construye el **Underwriter Agent** (loop: leer activo → pagar x402 por datos → cotizar con LLM → firmar stake → atestar). Corre 1 agente completo.
10. Clona a un **segundo Underwriter** con criterio distinto (competencia) y añade el **Servicer/Monitor Agent** (dispara waterfall + slashing).
11. Cablea el flujo completo: activo → 2 cotizaciones + stakes → vault con tramos → (Investor Agent compra) → default simulado → slashing + reputación. **Todo con tx reales.**

**FASE 3 — Producto y entrega (Días 5–6).**
12. Construye el **dashboard Next.js** (usa 2 instancias de Claude en paralelo: una en frontend, otra en integración de contratos). Muestra el clímax de slashing y links a CSPR.live.
13. Pulir UX, manejar errores, verificar que cada paso de la demo genera tx verificables.
14. **Graba el video demo** siguiendo el guion de la Sección 8.
15. Escribe el **README final** (qué es, arquitectura, cómo correr, direcciones de contratos en testnet, walkthrough) + arranca socials (para el tiro del top-3 en CSPR.fans).
16. **Sube a DoraHacks** con repo + video. Deja medio día de colchón.

**Checkpoint entre fases:** al cerrar cada fase, resume estado, lista las direcciones de contratos desplegadas y los hashes de tx de prueba, y confirma con el desarrollador antes de seguir.

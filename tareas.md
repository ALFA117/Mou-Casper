# TAREAS — AVAL / Mou Casper

> Archivo de control para que el humano (tú) lleve seguimiento. Se actualiza a medida que
> avanzamos. No reemplaza a `Mou-Casper.md` (spec del producto) ni a la sesión 2 pegada en
> consola (15 pasos) — este archivo es el tracker vivo de ambos.

---

## Decisión vigente: cómo se hace el deploy real (sin WSL2/Docker)

El usuario decidió **no usar WSL2 ni Docker** — se trabaja 100% en Windows nativo.

`casper-client` (el CLI en Rust) no compila nativo en Windows (su dependencia `casper-types`
usa APIs Unix-only). La solución adoptada: **`casper-js-sdk` (ya instalado en `/agents`, JS puro,
sin compilar nada)** para armar, firmar y enviar los deploys directo al RPC de testnet
(`https://node.testnet.casper.network/rpc`). Los `.wasm` ya compilados en Windows con
`cargo odra build` son válidos tal cual (WASM es el mismo target compile donde compile,
no hay diferencia Windows/Linux en el binario resultante).

`buildFor1_5()` del SDK genera el formato de Deploy clásico (legacy), que es la forma de esquivar
el bug conocido de `invalid pricing mode` (las herramientas nuevas mandan formato de transacción
nuevo; el nodo de testnet build 2.2.2 espera el clásico).

### Los 3 filos a vigilar (instrucción recibida — respetar al pie de la letra)

1. **El checkpoint no cambia.** Todo esto es teoría hasta que el `hello` deploye y tengamos el
   **hash con estado `success` en CSPR.live**. Ese hash es el semáforo — no se avanza a los 5
   contratos de AVAL sin él.
2. **Args de init de Odra al deployar el WASM crudo.** `cargo odra deploy` normalmente arma solo
   los args del constructor. Al deployar el `.wasm` crudo vía `casper-js-sdk`, esos args hay que
   pasarlos a mano y correctos. Si un contrato deploya pero "no responde", lo primero a revisar
   son los args del constructor (ver cada `init()` en `/contracts/src/*.rs`).
3. **Verificar versión exacta de `casper-js-sdk` instalada** (`/agents/node_modules`) antes de
   copiar ejemplos de documentación — v5.x y v2.x tienen APIs completamente distintas, mezclar
   ejemplos de ambas es fuente clásica de errores raros. (Ya confirmado: `5.0.12` está instalado.)

Bonus que se pierde y no importa: los tests unitarios de Odra corren en su propia VM
(`odra-test`), sin necesitar `casper-client` — eso nunca estuvo bloqueado.

---

## Hallazgos de investigación (links externos de Mou-Casper.md Sección 9)

**Whitepaper x402** (`x402.org/x402-whitepaper.pdf`): es un PDF binario, no se pudo extraer texto
con WebFetch. Pendiente: si hace falta el detalle fino del protocolo (formato exacto del header
de pago), pedirlo en el Telegram de soporte o revisar `docs.cspr.cloud/x402-facilitator-api/reference`
en vez del whitepaper crudo.

**`casper.network/ai` (Casper AI Toolkit):**
- x402 Facilitator: doc de referencia en `docs.cspr.cloud/x402-facilitator-api/reference`, ejemplos
  en el repo GitHub `casper-x402/tree/master/examples`. La página NO confirma explícitamente el
  mainnet status ni el mecanismo exacto de "uso patrocinado para equipos del buildathon" — esto
  sigue sin confirmar (ver Paso 6 abajo).
- Casper MCP Server: servidor **hosted** en `mcp.cspr.cloud`, basado en el repo comunitario
  `github.com/msanlisavas/casper-mcp`. Se conecta con `claude mcp add-json` (ver Paso 9 abajo).
- CSPR.click AI Agent Skill: `claude skill install cspr-click` — trae wallet, firma de tx,
  proxy a CSPR.cloud, deploy de contratos vía Odra.
- CSPR.trade MCP: `https://mcp.cspr.trade/` (DEX — no lo necesitamos, MVP no depende de liquidez).
- Odra: los agentes/IA pueden leer `https://odra.dev/llms.txt` para generar contratos.

**`casper-agent-kit` (glama.ai):** OJO — esto es un proyecto de ejemplo distinto ("Treasury Guard
Agent"), NO el Casper MCP Server oficial. Sirve solo como **referencia de patrón de agente**
(perceive → decide/evaluate → prepare → verify), no como servidor a instalar. Su loop real:
lee un escenario JSON → evalúa contra reglas (`treasury_guard_evaluate_policy`, con análisis LLM
opcional) → prepara una acción (`treasury_guard_prepare_action`) → ejecuta on-chain y registra el
recibo. Útil como inspiración de estructura para el Servicer/Monitor Agent (Paso 9), pero las
herramientas MCP que expone (`treasury_guard_*`) NO aplican a AVAL — son de otro dominio.

---

## Estado actual (resumen)

- [x] `Mou-Casper.md` leído completo.
- [x] Wallet de testnet generada (`/keys`, gitignored) — **falta fondear desde el faucet (tarea humana)**.
- [x] Repo inicializado: `README.md` + `.env.example`.
- [x] 5 contratos de AVAL escritos (`Constitution`, `Reputation`, `UnderwriterStake`,
      `AttestationRegistry`, `TrancheVault`) + `Hello` de sanity-check — **compilan a `.wasm` en
      Windows nativo**, verificado con `cargo odra build`.
- [x] Dashboard Next.js con `ui-ux-pro-max`, dark fintech theme, componente 3D de fondo
      (`Background3D.tsx`, react-three-fiber) — **datos MOCK eliminados en el Paso 11**, ahora
      lee estado real on-chain + run-log real. `npm run build`/`dev` verificados.
- [x] `hello.wasm` deployado a Testnet con estado `success` (hash `892cbd2d...`) — checkpoint del
      Paso 4 cumplido. Ver bitácora completa arriba para el detalle del bug de bulk-memory y su fix.
- [x] `casper-client` CLI: descartado para este proyecto (no compila en Windows). Reemplazado por
      `casper-js-sdk` para todo lo que requiera firmar/enviar deploys — confirmado funcional.

---

## Pendientes — Fase A: Toolchain y deploy real

- [ ] **Paso 1 (revisado):** script Node.js en `/scripts` con `casper-js-sdk` (`RpcClient`,
      `SessionBuilder`, `buildFor1_5()`) capaz de armar + firmar + enviar deploys al RPC de
      testnet. Documentar versión exacta del SDK usada.
- [x] ~~Paso 2: recompilar en WSL2~~ — no aplica, el `.wasm` de Windows es válido.
- [x] **Paso 3:** balance de `underwriter_1` verificado en CSPR.live — 5,000 CSPR confirmados
      (tx `5f9bf...4e617`, bloque 8,400,229). Fondeo hecho por Edgar vía import de la keypair
      a la extensión Casper Wallet (el faucet solo fondea la cuenta activa de la extensión,
      no permite pegar una public key arbitraria).
- [x] **Paso 4 — CHECKPOINT:** deploy de `hello.wasm` a Testnet. Evidencia obligatoria: hash de tx
      con estado `success` en CSPR.live. No se avanza sin esto. ✅ Cumplido — ver bitácora abajo.
- [x] **Paso 5:** deploy de los 5 contratos de AVAL — ✅ los 5 exitosos al primer intento,
      escalando el payment por tamaño relativo a `hello` (ratio wasm-size × 300 CSPR, redondeado
      arriba): Constitution 320, Reputation 310, UnderwriterStake 320, AttestationRegistry 330,
      TrancheVault 330 CSPR. Direcciones + hashes guardados en `README.md` (tabla de contratos)
      y en `deployments.json`. Orden de dependencias respetado: Constitution → Reputation →
      UnderwriterStake → AttestationRegistry → TrancheVault.
      **Gasto total Fase A (hello + 5 contratos): 2,180 CSPR. Balance final: 2,820 CSPR.**

### Bitácora de intentos de deploy del Paso 4 (hello.wasm)

1. **Intento 1 — `invalid pricing mode`:** no ocurrió. El deploy SÍ llegó a un bloque real
   (`213ce115...`, block `55286b12...`) pero **FAILURE**: `Wasm preprocessing error:
   Deserialization error: Bulk memory operations are not supported`. Costo: 150 CSPR (se cobra
   aunque el wasm falle en preprocesamiento — dato clave para el presupuesto).
   - **Causa raíz real:** el `.wasm` compilado localmente contenía instrucciones `memory.copy`
     (bulk-memory) que el motor de ejecución del nodo (build 2.2.2) no soporta. NO era un problema
     de `buildFor1_5`/pricing mode — el script de deploy en sí funcionó bien desde el primer intento.
   - `wasm-opt` (Binaryen) y `wasm-strip` (WABT) **no estaban instalados** en la máquina — sin
     ellos, `cargo odra build` termina con error en el paso de optimización, pero **ya había
     guardado los `.wasm` sin optimizar/sin lowering antes de fallar**, y esos fueron los que se
     usaron para el deploy.
   - Fix aplicado: `contracts/rust-toolchain.toml` (channel `nightly-2026-01-01`, antes plano) +
     `contracts/.cargo/config.toml` con `[target.wasm32-unknown-unknown] rustflags =
     ["-C", "target-feature=-bulk-memory,-sign-ext"]`. **Ojo:** esto NO fue suficiente por sí solo
     — el `core`/`alloc` de Rust vienen precompilados con bulk-memory activado y no se recompilan
     con nuestras rustflags. Se necesitó instalar `wasm-opt` (binario oficial de
     `WebAssembly/binaryen` release `version_130`, descargado a `~/bin`) y `wasm-strip` +
     `wasm-objdump` (de `WebAssembly/wabt` release `1.0.41`, mismo `~/bin`) para que `cargo odra
     build` corriera su paso de lowering (`--signext-lowering` +, si detecta toolchain reciente,
     `--llvm-memory-copy-fill-lowering`) completo. Con eso, `cargo odra build` corre limpio
     (exit code 0) y los 7 `.wasm` quedan sin bulk-memory/sign-ext — verificado con `wasm-tools
     print` + `wasm-objdump -d` (0 ocurrencias de `memory.copy`/`memory.fill`/`extend*_s` en los 7).
   - Intentar pinnear un toolchain viejo (Rust 1.84.0, anterior al corte `2025-02-17` que usa
     `cargo-odra` para decidir si aplica el lowering) **se descartó**: una dependencia transitiva
     (`toml_writer`) ya requiere `edition2024`, que solo estabilizó en Rust 1.85 — ese camino
     choca de frente con el mismo corte que se quería evitar.
2. **Intento 2 (20 CSPR, wasm ya arreglado):** `FAILURE` — `Out of gas error`. Ya no hay error de
   formato, solo faltó presupuesto.
3. **Intento 3 (100 CSPR):** `FAILURE` — mismo `Out of gas error`, igual que con 20 CSPR.
   Sospechoso: **investigación gratis (sin gastar CSPR)** escaneando bloques recientes del RPC
   encontró 6 deploys reales de otro equipo con `session.moduleBytes` que costaron exactamente
   10 CSPR cada uno — pero resultaron ser llamadas a un entry-point (`log_action`) vía el wasm
   genérico "proxy caller" de Odra (mismo wasm de 184,758 bytes en los 6, args
   `package_hash`/`entry_point`/`args`/`attached_value`/`amount`), **no instalaciones reales** —
   pista falsa, descartada. Sigue pendiente encontrar un install real comparable (tamaño de wasm
   distinto entre casos, args `odra_cfg_*`) antes de decidir el próximo monto de payment.
   **Regla nueva acordada con el usuario:** ningún deploy de instalación con menos de 300 CSPR de
   payment de aquí en adelante; si 300 CSPR también da `Out of gas`, detenerse y preguntar en
   `t.me/CSPRDevelopers` en vez de seguir subiendo el monto a ciegas.
4. **Intento 4 (300 CSPR) — ✅ CHECKPOINT CUMPLIDO:**
   - Deploy hash: `892cbd2d71fe3c3bd226ef2ce99ed31da19b5f723ca9d6c0e90e9c575cc79858`
   - Block hash: `b76a277bd9081e0371d724a1c0f20b9125af5365f913ce50fee9ad87bdb9ba5d`
   - Estado: **SUCCESS**. Costo real: 300 CSPR.
   - Ver: https://testnet.cspr.live/deploy/892cbd2d71fe3c3bd226ef2ce99ed31da19b5f723ca9d6c0e90e9c575cc79858
   - Script usado: `scripts/deploy-hello.js` (reutilizable como base para el Paso 5, cambiando
     wasm/args por contrato).

**Gastado en intentos fallidos + el exitoso: 570 CSPR** (150 + 20 + 100 + 300) de los 5,000 CSPR
del faucet → **quedan 4,430 CSPR** para el Paso 5 (5 contratos AVAL) y la demo.

### Plan B si el deploy falla (fallback, no esperar a que truene 3 veces para tenerlo listo)

Si `buildFor1_5()` sigue dando `invalid pricing mode` o cualquier rechazo del nodo:

1. **Preguntar en Telegram `t.me/CSPRDevelopers`** el combo exacto de versiones que corre HOY en
   testnet (node build, `casper-js-sdk` recomendado, pricing mode esperado) — el organizador
   responde, no solo el bot. No adivinar versiones a ciegas más de una vez.
2. **Probar el otro RPC / vía alterna** antes de asumir que es un bug de código:
   - Primario: `https://node.testnet.casper.network/rpc` (el de `Mou-Casper.md`).
   - Alterno: **proxy RPC de CSPR.cloud** vía CSPR.click SDK ("cloud proxies" — necesita `appId`,
     usa `csprclick-template` en localhost). Documentado en el skill `csprclick-skill`.
   - Si ambos fallan igual, es señal de que el problema es el formato del deploy, no el nodo —
     enfocar ahí el debug (volver al punto 1).
3. Si tras esto sigue fallando 3 veces con el mismo error: **detenerse y reportar** (regla #3 de
   la sesión 2) con el error exacto + estas 2 opciones ya evaluadas, en vez de seguir intentando.

### Presupuesto de gas — histórico (Fase A, tabla original, ver corrección de netos abajo)

Esta tabla original (Paso 4) estimaba en bruto y quedó superada — se deja como referencia
histórica de cómo se calibró originalmente el presupuesto, no como número vigente:

| Concepto | Estimado (CSPR) | Base |
|---|---|---|
| Deploy `hello.wasm` | 300 (real) | Confirmado, hash `892cbd2d...` |
| Deploy de los 5 contratos AVAL | ~1,500–2,500 | Extrapolado del dato real de `hello` |
| Llamadas de entry-point durante la demo | ~100–300 | Sin confirmar en su momento |

### ⚠️ Corrección de costos: bruto vs. neto (descubierto en Paso 9)

Todo el tracking de "costo" hasta el Paso 8 usaba el **`payment` bruto declarado**, no el costo
real. Casper **reembolsa el gas no consumido** (campo `refund` en `execution_result`, nunca leído
por nuestros scripts hasta el Paso 9). Esto aplica sobre todo a las llamadas vía
`ContractCallBuilder`/proxy caller a contratos ya deployados (instalaciones vía `SessionBuilder`
puro parecen no tener el mismo refund visible — no se verificó retroactivamente, no vale la pena
recalcular gasto ya histórico). **A partir de ahora, el balance se lee ON-CHAIN
(`queryLatestBalance`), no se calcula por aritmética.**

**Tabla de costos NETOS reales confirmados (payment − refund), por tipo de llamada:**

| Tipo de llamada | Costo neto real observado | Muestras |
|---|---|---|
| Instalación de contrato (`SessionBuilder`, wasm ~270-290KB) | 300–330 CSPR (bruto, sin refund verificado) | 6 contratos, Fase A |
| Entry-point no-payable simple (`register`, `attest`, `assert_within_exposure` exitoso) | ~3.9–5.8 CSPR | `penalize`, `reward`, `slash`: 3.88–5.77 CSPR |
| Entry-point no-payable con más storage (`mark_default`) | ~4.1 CSPR | 1 muestra |
| Entry-point payable vía proxy caller (`stake`, `buy_senior`, `buy_junior`, `deposit` WCSPR) | 40 CSPR bruto (neto no verificado — el bug de Paso 8 se descubrió antes de leer refund) | múltiples |
| Settlement x402 (CEP-18 `transfer_with_authorization`, formato `TransactionV1`) | 15 CSPR (bruto = neto en este caso, refund no aplicado o ya incluido en el `cost` mostrado) | 3 muestras |
| Transferencia nativa CSPR (fondeo de wallets) | 3 CSPR | 3 muestras |

**Balance real de `servicer`, leído directo on-chain (fuente de verdad, no aritmética) al cierre
del Paso 10: 1,806.97 CSPR.**

## Pendientes — Fase B: x402 y agentes

### Decisión de identidades (roles) — tomada antes del Paso 6

La wallet que deployó los 5 contratos (antes `underwriter_1`) es dueña (`owner`) de las funciones
solo-owner (`slash`, `mark_default`, `penalize`, `reward`, `register`) porque `owner = quien llamó
init()`. Ninguno de los contratos tiene `transfer_ownership`. Decisión: **no tocar ownership** —
esa wallet se renombra a **`servicer`** (`keys/servicer_*.pem`, mismo par de llaves, cero costo on-chain
por el rename) y firma tanto sus acciones de servicer como las llamadas admin. Se generaron 3
wallets nuevas con `agents/keygen.js <nombre>`: `underwriter_A`, `underwriter_B`, `investor` — así
la demo muestra 4 llaves distintas en CSPR.live (apuesta / apuesta / castiga / compra), necesario
para que la narrativa de "trust layer" resista inspección de un juez.

**Fondeo (transferencias nativas desde `servicer`, `scripts/fund-wallet.js`):**

| Wallet | Public key | Monto | Deploy hash | Estado |
|---|---|---|---|---|
| underwriter_A | `01fb6f5a...4d5e` | 400 CSPR | [`a52fe4d3...12a1`](https://testnet.cspr.live/deploy/a52fe4d396fbc943c973bf396d32cbd61e84d3307b80633aeb330db9664412a1) | success |
| underwriter_B | `01c76517...0b736` | 500 CSPR | [`16931a49...ed17a`](https://testnet.cspr.live/deploy/16931a498e31b830cce67fd2f7fa3886f8190df88589e4d4636bb9e211eed17a) | success |
| investor | `01c0c4c0...11910` | 250 CSPR | [`b919e9dd...baba063`](https://testnet.cspr.live/deploy/b919e9dd478270df1bf2c44a3415cd382642a90bdc8b0c5cd7fab061ebaba063) | success |

Costo de las 3 transferencias: 9 CSPR (3 CSPR c/u). **Balance de `servicer` tras fondeo: 2,820 −
1,150 (transferido) − 9 (gas) = 1,661 CSPR.** Presupuesto completo de la demo (12 llamadas de
entry-point por corrida, montos de stake/inversión, proyección a 4 corridas) documentado en la
conversación con Edgar del 2026-07-04.

**Dato real de gas por llamada payable vía proxy caller (Paso 6.3, wrap de WCSPR): 40 CSPR por
llamada exitosa** (bastante más que el supuesto de 15 CSPR usado en la proyección de 4 corridas —
**revisar y ajustar esa proyección antes de Paso 7**, probablemente necesite subir los montos de
payment planeados para `stake()`/`buy_senior()`/`buy_junior()`, que también son payable y pasan
por el mismo mecanismo de proxy caller). Balance de `servicer` tras la depuración del wrap (180
CSPR de gas, ver bitácora del Paso 6 abajo): 1,661 − 180 = 1,481 CSPR. Tras el settlement x402
exitoso (15 CSPR, ver Paso 6.6): **balance de `servicer`: 1,466 CSPR.**

- [x] **Paso 6 — COMPLETO:** endpoint x402 propio en `/x402-service`.
  1. [x] **Investigación del facilitator (gratis, sin gastar CSPR) — resultado sorpresa:**
     - x402 en Casper usa un token **CEP-18 "Wrapped CSPR" (WCSPR)**, NO CSPR nativo directo.
       Package hash real de testnet (no placeholder):
       `hash-3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e`. 9 decimales
       (misma escala que motes, 1:1). Contrato activo (versión 7):
       `hash-4b351800391d4a47a7f932e9498516ed59bb41056d2743c14a8b1a5f90f67b3e` (confirmado vía
       RPC `query_global_state` sobre el package, gratis).
     - El patrón oficial (`make-software/casper-x402`) es **auto-hospedar el facilitator**
       (Go o TypeScript), firmando settlements con tu propia wallet — sin API key, sin registro.
     - El facilitator hosteado de CSPR.cloud (`x402-facilitator.cspr.cloud`) SÍ requiere
       solicitar un access token en cspr.cloud — sin tier gratuito confirmado.
     - **"Uso patrocinado para equipos del buildathon": no confirmado en ningún lugar público**
       (docs, whitepaper ilegible, ni el repo de ejemplos). Sigue pendiente preguntar en
       `t.me/CSPRDevelopers` — Edgar lo pregunta en paralelo, no bloquea el resto.
  2. [x] **Decisión tomada:** auto-hospedar el facilitator con la wallet `servicer` firmando los
     settlements (encaja narrativamente con su rol admin).
  3. [x] **Conseguir WCSPR para underwriter_A y underwriter_B — resuelto vía `deposit()` en el
     token WCSPR** (wrap 1:1 de CSPR nativo). Bitácora de la depuración (3 intentos fallidos, 1
     exitoso — dejar como referencia para futuras llamadas payable):
     - Casper (formato Deploy clásico) no tiene "msg.value" nativo para `StoredContractByHash`
       — la única forma de adjuntar valor es un **session wasm** que hace el top-up de la
       cargo_purse y luego llama al entry point. Se usó el **`proxy_caller_with_return.wasm`
       oficial de Odra** (`odradev/odra` tag `2.8.2`,
       `odra-casper/test-vm/resources/proxy_caller_with_return.wasm`, descargado a
       `scripts/wasm-tools/`, 184,758 bytes — verificado sin bulk-memory/sign-ext con
       `wasm-tools`). Documentado en `https://odra.dev/docs/backends/casper`.
     - **Intento 1 y 2 — `ApiError::EarlyEndOfStream [17]`:** el campo `args` del proxy caller es
       `Bytes` en Rust, que en CLType es `List(U8)` — se mandó como `ByteArray(N)` (tipo de
       tamaño fijo, para hashes de 32 bytes) por error. Confirmado leyendo
       `odra-casper/proxy-caller/src/lib.rs` (`ProxyCall::load_from_args`) directo del repo, no
       un resumen. Costo: 20 CSPR c/u (mueren en deserialización, antes de la parte cara).
     - **Intento 3 — `Mint error: 21` (`UnapprovedSpendingAmount`):** al arreglar el tipo de
       `args`, apareció un error DISTINTO (progreso, no bug repetido) — confirmado en
       `casper-node/types/src/system/mint/error.rs`. Causa real (confirmada en
       `execution_engine/src/execution/executor.rs`): el motor de ejecución de Casper lee un
       arg `amount` en la sesión (independiente de lo que el wasm del proxy caller lea) para
       fijar el `remaining_spending_limit` de esa ejecución — sin él, el límite es 0 y CUALQUIER
       transfer dentro de la sesión (el top-up de la cargo_purse) revienta. Se había quitado ese
       arg por error, asumiendo que era redundante. Costo: 40 CSPR (con margen×2 tras el primer
       error, que resultó no ser el problema real).
     - **Intento 4 — SUCCESS:** con `amount` restaurado (= mismo valor que `attached_value`),
       wrap de 10 CSPR exitoso. Script final: `scripts/call-payable.js` (reutilizable para
       cualquier entry-point payable — `stake()`, `buy_senior()`, `buy_junior()`).
     - Resultado: `underwriter_A` y `underwriter_B` con **10 WCSPR c/u** confirmado leyendo el
       diccionario `balances` del contrato (`scripts/check-wcspr-balance.js`; el dictionary item
       key es el **base64 de `Key::Account(account_hash)`**, no el hex crudo — otro detalle no
       documentado que costó una vuelta extra).
       - `underwriter_A` deposit: [`a7297ca4...73a7f5`](https://testnet.cspr.live/deploy/a7297ca4dbb6d4b4e5e1fe999d421eb084503dac3f348c94620ca3215d73a7f5) — SUCCESS, 40 CSPR
       - `underwriter_B` deposit: [`13fa0f65...51e5067`](https://testnet.cspr.live/deploy/13fa0f651d3780a861e1dfb682f128b876523d0a58e2558558154c1fb51e5067) — SUCCESS, 40 CSPR
     - **Gas total de esta sub-tarea (pagado por `servicer`): 20+20+20+40+40+40 = 180 CSPR**
       (3 intentos fallidos: 20+20+40 CSPR de payment desperdiciado, + 2 wraps exitosos de 40
       CSPR c/u). Aparte, 20 CSPR (10 c/u) salieron del balance propio de underwriter_A/B —
       no es gasto de `servicer`, es conversión CSPR→WCSPR de su propio dinero.
  4. [x] `servicer` recibe el settlement (`PAYEE_ADDRESS`), coherente con su rol admin.
  5. [x] **Ciclo HTTP implementado en `/x402-service`** usando los paquetes oficiales publicados
     en npm (`@x402/core`, `@x402/express`, `@x402/fetch`, `@make-software/casper-x402` —
     resulta que SÍ están en el registro público aunque el monorepo los referencie como
     `workspace:*` internamente):
     - `facilitator.ts`: auto-hospedado, firma settlements con la key de `servicer`
       (`toFacilitatorCasperSigner`), puerto 4022.
     - `server.ts`: resource server en `/risk-data` (datos de riesgo de mercado por batch de
       facturas — `defaultProbabilityBps`, `recommendedSpreadBps`), precio 0.5 WCSPR/request,
       cobra a `servicer`, puerto 4021.
     - `test-client.ts`: cliente de prueba con la key de `underwriter_A` (`@x402/fetch` +
       `wrapFetchWithPayment` maneja el 402 y la firma del pago automáticamente).
  6. [x] **Evidencia — ciclo completo exitoso al primer intento:**
     ```
     GET /risk-data?assetId=invoice-batch-001
     → 402 (manejado automaticamente por el cliente)
     → 200 { assetId, defaultProbabilityBps: 320, recommendedSpreadBps: 450, source: 'aval-risk-feed-v1' }
     → settlement: { success: true, payer: underwriter_A, transaction: f905270a...33a }
     ```
     Hash de settlement: [`f905270a...1333a`](https://testnet.cspr.live/deploy/f905270a501db76705f8fd8d949fc110485d546fcf406150eae0cb27f2a1333a)
     — **SUCCESS, costo real 15 CSPR** (coincide con la estimación de 15 CSPR/llamada
     no-payable — buena señal para el presupuesto de Paso 7-10). Nota técnica: este settlement
     usa el formato `TransactionV1` moderno (no el legacy `buildFor1_5` que necesitan nuestros
     WASM propios) — por eso hay que consultarlo con `getTransactionByTransactionHash`, no
     `getDeploy` (`scripts/check-deploy.js` prueba ambos). Confirma que el problema de
     bulk-memory era específico de nuestros WASM compilados localmente, no del formato de
     transacción en general — llamadas normales a contratos ya deployados sí pueden usar el
     formato moderno sin problema.
- [x] **Paso 7 — COMPLETO:** Underwriter Agent #1 — loop completo (leer activo → pagar x402 →
      cotizar con LLM real → stake en `UnderwriterStake` → atestar en `AttestationRegistry`).
  - [x] **Calibración previa (antes de escribir el agente):** `register()` y `attest()` (con
    reasoning de 442 caracteres) probados directo vía `ContractCallBuilder`
    (`scripts/call-entry-point.js`), **ambos SUCCESS a 15 CSPR** — confirma la estimación de
    15 CSPR/llamada no-payable en los 3 casos probados hasta ahora (x402 settlement, register,
    attest). Hashes: register
    [`ca1afc6b...92b1e2b`](https://testnet.cspr.live/deploy/ca1afc6b63fcab29517884ae61ea9863c35db6193a88c3de0cbad788a92b1e2b),
    attest [`01522569...28ec7db`](https://testnet.cspr.live/deploy/0152256935185539add212521a479ce7948946d91c08efd4ed60eb03328ec7db).
  - [x] **Cambio de LLM: Anthropic → Gemini (decisión del usuario, presupuesto $0 en LLM).**
    Edgar dio una API key de Gemini con formato nuevo (`AQ.` en vez de `AIzaSy...`) — no
    coincidía con el formato que yo conocía, pero una prueba aislada y gratuita (`generateContent`
    sin tocar blockchain, `agents/test-gemini-key.js`) confirmó que autentica bien. El único
    problema real fue de modelo, no de key: `gemini-2.0-flash` devuelve cuota 0 en el tier
    gratuito de esta cuenta (probado 2026-07-05) — **`gemini-2.5-flash` sí tiene cuota y
    funciona**, ahora es el modelo fijado en el agente. Usa `responseSchema` de Gemini para forzar
    JSON estructurado (sin regex de parseo) y retry con backoff en 429.
  - [x] **Bug de interop CJS descubierto y resuelto:** `@make-software/casper-x402` (build CJS)
    rompe con `TypeError: Cannot destructure property 'KeyAlgorithm'...` al hacer `require()` de
    `casper-js-sdk` desde un proyecto CommonJS plano — bug de empaquetado en su `__toESM` bundle,
    no pasa en ESM (por eso `x402-service`, que usa `tsx`/ESM, nunca lo tuvo). Fix: agente
    reescrito como `agents/underwriter-agent.mjs` (ESM puro, `import` en vez de `require`) — se
    eliminó la versión `.js` en CommonJS.
  - [x] **Evidencia — corrida completa exitosa al primer intento** (`underwriter_A`,
    `invoice-batch-001`, stake de 15 CSPR — dentro del rango mínimo 10-20 acordado):
    ```
    1) x402:     0700cda990ebcc42b3e478cebbd09f435269a16f73646cc84f099309d8492b9b   SUCCESS (0.5 WCSPR)
    2) register: 38998b27203debb0fe7c479b90d05ddf93df3ab23935dd400f044996f53aaeaa   SUCCESS (15 CSPR)
    3) stake:    fe1827963a23389f5c42a39b1fc1150c68b8d44bffc080f751b59659f77f933f   SUCCESS (40 CSPR + 15 CSPR apostados)
    4) attest:   70315cdd0700dd1a4db2e6c0dc74631d2d5851bc3527cd040bcbda36ad21190f   SUCCESS (15 CSPR)
    ```
    Cotización real de Gemini: `{"rating":680,"recommended_tranche":"senior","price_bps":450,
    "short_reasoning":"...275 caracteres...","extended_reasoning":"...razonamiento completo..."}`.
    Hash sha256 del razonamiento extendido guardado en `reasoning_hash`
    (`839de0673b1a25aa516d1443be5116d7249e2c8fdf687bd0403db4c236de0db1`), razonamiento corto
    (275 caracteres, dentro del límite de 500) guardado literal on-chain en `reasoning`.
    **register/attest confirman 15 CSPR de nuevo — el dato ya no es una muestra de 1, es
    consistente en 3+ llamadas no-payable distintas.**
    Costo de esta corrida: 15 (register, pagado por `servicer`) + 40+15 (stake+attest, pagados por
    `underwriter_A`) = 70 CSPR de gas + 15 CSPR apostados + 0.5 WCSPR. **Balance de `servicer`:
    1,466 − 15 = 1,451 CSPR.**
- [x] **Paso 8 — COMPLETO:** Underwriter Agent #2 — mismo loop, criterio de riesgo distinto
      (competencia visible).
  - [x] **`agents/underwriter-agent.mjs` parametrizado por perfil de riesgo** (no se duplicó el
    archivo): objeto `RISK_PROFILES` con `conservative` y `aggressive`, cada uno una filosofía de
    underwriting completa inyectada en el prompt (no números hardcodeados — la discrepancia sale
    del criterio, tal como pidió el usuario). CLI: `<wallet> <assetId> <stakeCspr> <profile>
    [full|quote-only]`. `quote-only` permite comparar cotizaciones sin repetir el costo on-chain
    de un underwriter que ya corrió su loop completo antes.
  - [x] **Comparación real, mismo activo `invoice-batch-001`:**

    | Campo | A — conservador | B — agresivo |
    |---|---|---|
    | rating | 954 | 900 |
    | tranche | **senior** | **junior** |
    | price_bps | **650** (por encima del mercado, 450) | **375** (por debajo del mercado, 450) |

    El `rating` numérico quedó cercano (no es el campo más dramático), pero `tranche` y
    `price_bps` son directamente opuestos y con un swing de 275bps en sentidos contrarios al
    benchmark de mercado (450bps) — A cobra de más por estar seguro (senior), B cobra de menos
    por tomar más riesgo (junior). Es precisamente la firma de "sobre-cotización": cuando el
    default simulado golpee el tramo junior primero (waterfall), B es quien queda expuesto —
    candidato correcto para el slashing del Paso 9/10. Pendiente evaluar si el jurado necesita
    también más separación en el `rating` puro; ajustar el prompt si hace falta antes de grabar
    el video final.
  - [x] **Bug encontrado (primer intento real con texto no-ASCII on-chain): `CLValue.newCLString`
    de `casper-js-sdk` calcula el prefijo de longitud con `.length` de JS (UTF-16) en vez de bytes
    UTF-8 reales** — con tildes/eñes (2 bytes UTF-8, 1 UTF-16) el prefijo queda corto y el string
    se corrompe al deserializar en cadena, dando `User error: 64649` (opaco, no es un error propio
    de `AttestationRegistry` — el contrato no valida longitud). Confirmado sin gastar CSPR
    comparando `Buffer.byteLength(s,'utf8')` vs el prefijo real codificado. Fix: transliteración
    a ASCII (`normalize('NFD').replace(...)`) del `short_reasoning` antes de mandarlo on-chain —
    afecta solo el texto legible en el explorador, `extended_reasoning` (hasheado, nunca on-chain)
    sigue con acentos normales. También se instruyó al prompt de Gemini a producir ASCII para ese
    campo específico (doble red de seguridad).
  - [x] **Evidencia — hashes de B, todos SUCCESS:**
    ```
    x402:     45d3596140a53545826a711313a3efc424ccd736135b7e52e1634d62b383f381   SUCCESS (0.5 WCSPR)
    register: c612e198af3b4317ebcd141702e92d5ad29776adaefa7d664c50122b090acbe4   SUCCESS (15 CSPR)
    stake:    bd392406183fe8da2aeff5ad34d2baac033d065d0fce237ff709f53eb336b1a0   SUCCESS (40 CSPR + 20 CSPR apostados)
    attest:   ef2d293354e439fcd9321d79a13e5b35e8cd256bdfe31ac827745a0e41dd74ff   SUCCESS (15 CSPR, 2do intento)
    ```
    Intento 1 de attest (fallido por el bug de encoding, string con tildes):
    `1f065497f5ea51243f8ff52e4dfe1af583039e035c1f32efe638384f375ad98a` — FAILURE, 15 CSPR perdidos
    (queda como referencia del bug, no se reintenta).
  - **Gasto Paso 8:** `servicer` pagó register de B (15) + gas de 2 settlements x402 nuevos
    (quote-only de A + corrida de B, 15 c/u = 30) = 45 CSPR. `underwriter_B` pagó stake (40) +
    attest fallido (15) + attest exitoso (15) = 70 CSPR de gas + 20 CSPR apostados.
    **Balance de `servicer` (estimado por aritmética en su momento): 1,451 − 45 = 1,406 CSPR.**
    ⚠️ **Corrección (Paso 9): este número era demasiado bajo.** Todo nuestro tracking de "costo"
    hasta ahora reportaba el `payment` bruto declarado, pero Casper **reembolsa** el gas no
    consumido (campo `refund` en `execution_result`, nunca leído hasta ahora por nuestros
    scripts). El balance REAL de `servicer` leído directo on-chain al momento del Paso 9 era
    **1,881.38 CSPR**, no 1,406. A partir de aquí, el balance se **lee on-chain**
    (`queryLatestBalance`), no se calcula por aritmética — ver Paso 9 para el detalle y el
    balance final real.
- [x] **Paso 9 — COMPLETO:** Servicer/Monitor Agent.
  - [x] **Decisión: sin MCP server ni SSE por ahora.** Se evaluó pero se descartó para esta fase
    por la regla explícita del usuario ("lo más simple y confiable, no lo más elegante"): el
    detonador del default es un **comando manual** en esta fase (el botón real vive en el
    dashboard, Paso 12/13) — lo que importa es que la CADENA de consecuencias, una vez
    disparada, corra sola sin pasos manuales intermedios. `agents/servicer-agent.mjs
    <assetId> <lossAmountCspr>` hace exactamente eso: `mark_default → slash → penalize →
    reward` en una sola invocación. Conectar el Casper MCP Server / SSE queda pendiente para si
    se necesita monitoreo continuo real más adelante (no bloquea la demo).
  - [x] **Slashing proporcional al sobre-precio de B, usando `slash()` tal cual está (sin
    lógica off-chain que el contrato no respalde):** `slash(underwriter, bps, beneficiary)` no
    calcula nada por su cuenta — el `bps` lo decide quien llama. Fórmula usada (calculada una
    sola vez, off-chain, documentada en el propio script): `bps = round((450 − 375) / 450 ×
    10000) = 1667` — el sub-precio real de B (375bps cotizados vs 450bps recomendados por el
    feed de riesgo, del Paso 8). `penalize` escala el mismo porcentaje al rango de reputación
    0-1000 (167 puntos); `reward` para A es un reconocimiento fijo de 50 puntos (no hay una
    fórmula equivalente que el usuario haya pedido atar a algo específico).
  - [x] **Bug nuevo encontrado y resuelto — `slash()` falló primero con `User error: 64639`.**
    Descifrado el esquema de códigos de Odra (`core/src/error.rs`, tag 2.8.2): los errores
    internos del framework se reportan como `64536 + discriminante del enum
    ExecutionError`. `64639 − 64536 = 103` → `TransferToContract` ("Can't transfer tokens to
    contract"). Causa: `UnderwriterStake.slash()` intenta `env().transfer_tokens(beneficiary,
    slashed)`, y Odra bloquea transferencias nativas directas a un CONTRATO (`TrancheVault` no
    tiene un entry-point payable para recibir esto). Fix: `beneficiary` = `servicer` (una
    cuenta, actuando como tesoro del protocolo) en vez de `TrancheVault` — el contrato se usó
    tal cual, sin tocar su código, solo se corrigió qué tipo de dirección recibe el argumento.
    De paso, este mismo esquema de códigos confirma retroactivamente el bug del Paso 8:
    `64649 − 64536 = 113` → `LeftOverBytes`, exactamente el error de deserialización por el
    bug de UTF-8 que ya habíamos diagnosticado de otra forma.
  - [x] **Descubrimiento (gratis, sin gastar de más): Casper reembolsa el gas no consumido.**
    El campo `refund` en `execution_result` nunca se había leído — nuestro tracking de "costo"
    reportaba el `payment` bruto declarado, no el costo neto real (`payment − refund`). Ejemplo
    real de esta corrida: `mark_default` declaró 15 CSPR, reembolsó 10.90, costo neto 4.10 CSPR.
    Confirmado también consultando el balance real de `servicer` directo en cadena
    (`queryLatestBalance`) en vez de seguir calculando por aritmética.
  - [x] **Estado ANTES → DESPUÉS (montos calculados con la fórmula real y verificada de los
    contratos — `slashed = stake * bps / 10000`, `penalize`/`reward` con `saturating_sub`/`min`
    — no leídos por retorno de función porque Casper no expone el valor de retorno de un
    entry-point ya confirmado a un cliente externo, y `speculative_exec` no está habilitado en
    este nodo público; confirmado probándolo, gratis):**

    | | underwriter_A (conservador) | underwriter_B (agresivo) |
    |---|---|---|
    | Stake antes | 15 CSPR | 20 CSPR |
    | Stake después | 15 CSPR (intacto) | 16.666 CSPR (−3.334 slasheados, 16.67%) |
    | Reputación antes | 500 | 500 |
    | Reputación después | 550 (+50 reward) | 333 (−167 penalize) |

  - [x] **Evidencia — hashes, todos SUCCESS (el slash tuvo un intento fallido antes del fix):**
    ```
    mark_default: e6ceb9df193b07d310a522fd5d76998d4e927940b089bc09b83344511fc24769   SUCCESS (neto 4.10 CSPR)
    slash (1er intento, beneficiary=TrancheVault): 095350659c88f736f67d38cbcb7b635349dd65d7d85539d2d822db0603d78833  FAILURE (User error: 64639, 15 CSPR perdidos)
    slash (2do intento, beneficiary=servicer):     756398580b36f9f38ae9167c78830907d03fc9439fb428543cfd438cd45ce5f4  SUCCESS (neto 5.77 CSPR)
    penalize:     bdf382b03f4ae7438256c34df7f8cdad56dc05744bacdf8e4192183bd0fd0f09   SUCCESS (neto 3.88 CSPR)
    reward:       deb266ba192e0e17ce78b4b7bf69f82080886e7d39c1dd3d905b308c69171113   SUCCESS (neto 3.88 CSPR)
    ```
  - **Gasto Paso 9 (costo neto real, no bruto): 4.10 + 15 (intento fallido, sin reembolso) +
    5.77 + 3.88 + 3.88 ≈ 32.63 CSPR.** **Balance real de `servicer` leído on-chain al cierre:
    1,852.09 CSPR.**
- [x] **Paso 10 — COMPLETO:** `agents/demo-run.mjs` orquesta el arco completo end-to-end en UNA
      invocación (`node demo-run.mjs <assetId> <aStakeCspr> <bStakeCspr> <investorSeniorCspr>
      <investorJuniorCspr> <lossAmountCspr>`). Para lograrlo, `underwriter-agent.mjs` y
      `servicer-agent.mjs` se refactorizaron para exportar sus funciones (además de seguir
      funcionando solos por CLI, vía un guard `isMainModule`), y `demo-run.mjs` los importa y
      compone en vez de duplicar lógica.
  - [x] **Corrida real de evidencia, activo `invoice-batch-002` (nuevo, para no duplicar
    atestaciones sobre `invoice-batch-001` de corridas anteriores) — 13 SUCCESS + 1
    FAILURE-esperada, todo al primer intento:**
    1. Tokenizar: paso conceptual (no hay entry-point de tokenización en el MVP — el activo ya
       vive en el feed x402 y se convierte en on-chain vía AttestationRegistry/TrancheVault).
    2. Underwriter A (conservador): rating 885, **senior, 1450bps** (muy por encima del mercado,
       1200bps).
    3. Underwriter B (agresivo): rating 940, **junior, 900bps** (muy por debajo del mercado,
       1200bps) — discrepancia tranche+price incluso más marcada que en el Paso 8.
    4. Investor compra ambos tramos (`buy_senior`/`buy_junior`, payable vía proxy caller).
    5. **Prueba de que `Constitution` revierte:** `assert_within_exposure(100,000 CSPR)` contra
       un límite de 500 CSPR → `FAILURE` con `User error: 4` = `ExposureLimitExceeded` (decodificado
       del propio enum de errores de `constitution.rs` — no un error genérico, el correcto).
       **Esa falla ES la evidencia — se captura como test-SUCCESS, no como bug.**
    6. Cadena del servicer: slash 2500bps (25%, el sub-precio de B esta vez fue mayor: 900 vs
       1200 de mercado) → `mark_default → slash → penalize → reward`, los 4 SUCCESS.
    ```
    A.x402   4c0f4e28...864deb        SUCCESS   A.register 5241968f...ad77e545   SUCCESS
    A.stake  81acb2cf...2cbe0c4       SUCCESS   A.attest   4a3c6ac9...617694921  SUCCESS
    B.x402   09410997...176e2e8       SUCCESS   B.register 9c4d93ab...19b8e74   SUCCESS
    B.stake  95df3143...933c6005a     SUCCESS   B.attest   1de7772c...ad95d28cb SUCCESS
    investor.buy_senior 9a7ce912...4324fb70     SUCCESS
    investor.buy_junior 467ef69d...9fdd50a43    SUCCESS
    constitution.revert_test 366106d5...4e8dded6  FAILURE (User error: 4 = ExposureLimitExceeded, esperado)
    servicer.mark_default b2cd474f...ce26fc9cb   SUCCESS
    servicer.slash         7d9f3bf1...0787d99e   SUCCESS
    servicer.penalize      7ee7d5f4...862717f3   SUCCESS
    servicer.reward        f7442e68...08b8355e   SUCCESS
    ```
  - [x] **Estado final verificado LEYENDO VALORES REALES on-chain** (no fórmulas — usando el
    patrón de diccionario del punto de Paso 11 abajo), acumulado sobre el estado ya existente de
    Paso 7/8/9:
    | | underwriter_A | underwriter_B |
    |---|---|---|
    | Stake | **30 CSPR** (15+15) | **27.4995 CSPR** (16.666+20, ×0.75 tras slash 25%) |
    | Reputación | **600** (550+50) | **83** (333−250) |
    Los 4 valores leídos coinciden EXACTO con lo calculado por la fórmula del contrato — doble
    confirmación de que el patrón de lectura (ver Paso 11) es correcto y no es un mock.
  - **Costo neto real de esta corrida (payment − refund, sin contar x402/WCSPR): ~27.63 CSPR.**
    **Balance real de `servicer` leído on-chain al cierre: 1,806.97 CSPR.**

- [x] **CRÍTICO para Paso 11 — cómo el dashboard lee estado real (investigado y resuelto):**
  Se evaluaron las 3 opciones pedidas:
  1. **Eventos CES:** descartada — los 5 contratos de AVAL NO llaman `emit_event()` en ningún
     lado (`grep` confirmó cero coincidencias). Odra monta la infraestructura CES (`__events*`
     named keys) por defecto, pero sin `#[odra::event]` en el código no se publica nada.
     Añadirlo requeriría recompilar y REdeployar los 5 contratos (~1,500+ CSPR) — no vale la
     pena para esta fase.
  2. **Reversear el layout del `state` uref:** descartada — el `state` uref es un marcador
     `Unit` vacío; Odra 2.8.x en Casper 2.x guarda los `Mapping` en el nuevo trie unificado sin
     exponer una clave de diccionario "adivinable" por adelantado.
  3. **Getters vía deploy barato — LA QUE FUNCIONA, con un matiz importante:** Casper no expone
     el valor de retorno de un entry-point ya confirmado (ni `getDeploy` ni
     `getTransactionByTransactionHash` lo traen; `speculative_exec` no está habilitado en este
     nodo público, confirmado probándolo gratis). PERO: cuando un getter como `stake_of`/
     `score_of` lee un `Mapping`, el log de efectos de ejecución SÍ revela la clave de
     diccionario completa tocada (`"key": "dictionary-<hash>", "kind": "Identity"`) aunque no
     el valor. Como esa clave de diccionario **es la dirección final en el estado global**
     (no una semilla que haga falta derivar), se puede consultar directo con
     `query_global_state` — **gratis, para siempre, una vez descubierta**.
  - **Patrón adoptado: "descubrir una vez (pagado, ~15 CSPR de payment, costo neto ~3-8 CSPR
    tras reembolso), leer para siempre (gratis)."** Scripts nuevos:
    `scripts/discover-dictionary-key.js` (hace la llamada real, imprime las claves de
    diccionario tocadas) y `scripts/read-dictionary-value.js <key> [U512|U32]` (lee y decodifica
    el valor, gratis). **Importante:** el decode difiere por tipo — `U512` (stakes, montos) es
    length-prefixed (1 byte de longitud + N bytes LE); `U32` (scores) son siempre 4 bytes LE
    fijos, sin prefijo — confundir los dos da un número equivocado (primer intento de leer
    `score_of` dio "2" en vez de 550 por este error, ya corregido en el script).
  - **Claves de diccionario ya descubiertas (reutilizables por el dashboard sin volver a
    pagar):**
    | Contrato.campo | Wallet | Dictionary key | Tipo |
    |---|---|---|---|
    | UnderwriterStake.stakes | underwriter_A | `dictionary-41f196d849589351ea849afc8baf8864bc934a6018e69c695a5715e129024a1e` | U512 |
    | UnderwriterStake.stakes | underwriter_B | `dictionary-8cddc301fc82835c2e7e38e5765d764f363fefb504bb38a17874a9395ea42d28` | U512 |
    | Reputation.scores | underwriter_A | `dictionary-20d6d7976fcfe015700efc6a65ba4ff1fb4f2bab22f3d65917cabe4fae6fc1b2` | U32 |
    | Reputation.scores | underwriter_B | `dictionary-e63f1b00352ad0f5fb3e6d47d1c8679a43d525991f2836b1b8a97aa5af43a717` | U32 |
## Pendientes — Fase C: Producto (datos reales + diseño)

- [x] **Paso 11 — COMPLETO:** dashboard conectado a datos reales, cero mocks.
  1. [x] **Claves de `TrancheVault` descubiertas — el patrón SÍ aplica igual a `Var`.** Sorpresa:
     aunque `senior_outstanding`/`junior_outstanding` son `Var<U512>` (no `Mapping`), la llamada
     real igual tocó una clave `dictionary-<hash>` en el log de efectos — Odra 2.8.x en Casper 2.x
     parece guardar TODOS los campos (Var o Mapping) vía el mismo mecanismo de Dictionary interno.
     4 claves nuevas descubiertas (`holding_of_senior`, `holding_of_junior`, `senior_outstanding`,
     `junior_outstanding`) con el mismo costo (~10 CSPR bruto c/u). Lectura de los 4 valores
     confirmó el mecanismo de waterfall en cascada: dos `mark_default(30 CSPR)` consecutivos
     (Paso 9 + Paso 10) dejaron `junior_outstanding=0` (vaciado del todo) y
     `senior_outstanding=90` (100 − 10 de derrame) — matemática exacta, verificada leyendo, no
     calculando.
  2. [x] **Arquitectura de lectura: rutas API en Next.js, nunca RPC directo desde el navegador.**
     `frontend/lib/server/chain-config.ts` (server-only, sin `NEXT_PUBLIC_`, nunca se bundlea al
     cliente) tiene las 8 claves de diccionario + hashes de contrato. `frontend/lib/server/
     casper-read.ts` hace el `query_global_state` y decodifica (U512 length-prefixed vs U32 fijo
     de 4 bytes — el mismo matiz del Paso 10). Ruta `GET /api/chain/state` expone el resultado
     limpio.
     - **Bug encontrado en el camino:** 8 lecturas en paralelo (`Promise.all`) devolvían
       intermitentemente `413 Payload Too Large` contra el RPC público (cada `query_global_state`
       trae un `merkle_proof` de ~40KB). Fix: lecturas secuenciales — más lento (~2-3s en vez de
       ~1s) pero 100% confiable, verificado con 3 llamadas consecutivas exitosas.
  3. [x] **El dashboard muestra el arco real:** `UnderwriterCard` (cotización real de Gemini,
     stake/reputación en vivo, hashes x402/register/stake/attest), `TrancheVaultPanel` (senior/
     junior outstanding en vivo + holdings del investor + botones de compra), `ClimaxPanel`
     (disparador de default real + resultado de la cadena del servicer + prueba de Constitution),
     `AttestationFeed` (reconstruido de `run-log.json`, no de un array en memoria). Cada tarjeta
     de tx usa `TxLink` → enlaza al hash real en CSPR.live.
  4. [x] **Botones disparan los scripts reales existentes, sin duplicar lógica:**
     `app/api/actions/{run-underwriter,invest,mark-default,demo-run}/route.ts` usan
     `child_process.spawn` sobre los mismos `.mjs` de `/agents` (reexportados como funciones en
     el Paso 10). `mark-default` deriva el bps de slash leyendo el ÚLTIMO quote real de B en
     `run-log.json` para el activo pedido, no un valor fijo. Cada botón muestra su costo estimado
     neto (`lib/dashboard-config.ts`, `ACTION_COST_ESTIMATES_CSPR`: ~55/40/30/180 CSPR según la
     acción).
  5. [x] **Grep final `mock|fake|stub|dummy|hardcoded` en todo el repo — limpio.** Las únicas 7
     coincidencias son comentarios que dicen explícitamente "NO es mock" (documentando la
     decisión) o el propio texto de esta tarea en `tareas.md` — cero código mock real. Se
     eliminaron `lib/mock-data.ts`, `lib/api.ts`, `lib/use-aval-simulation.ts` y
     `InvoiceBatchPanel.tsx` (mostraba una tabla de facturas 100% ficticia sin contraparte
     on-chain) completos.
  6. [x] **Evidencia — lectura real en vivo, verificada 3 veces seguidas vía la ruta API real:**
     ```
     GET /api/chain/state →
     underwriter_A: stake 30 CSPR, reputación 600
     underwriter_B: stake 27.4995 CSPR, reputación 83
     vault: senior 90 CSPR, junior 0 CSPR
     investor: senior 15 CSPR, junior 10 CSPR
     ```
     Estos son los MISMOS números verificados on-chain al cierre del Paso 10 — coinciden exacto,
     confirmando que la ruta API lee la cadena real y no un JSON local. `npx tsc --noEmit` y
     `npm run build` (producción, Turbopack) ambos limpios; las 8 rutas nuevas quedaron listadas
     como server-rendered (`ƒ`), la página principal como estática (`○`).
     **Nota de honestidad:** no se pudo tomar un screenshot visual del navegador en este entorno
     (sin herramienta de captura disponible) — la verificación fue vía `curl` sobre el HTML
     renderizado (contiene los labels reales `underwriter_A`/`underwriter_B`/`TrancheVault`/
     `demo:run`, cero errores de compilación/runtime) + llamadas directas a las rutas API (mismo
     código que dispara un clic real en el navegador).
  7. [x] **Clic real confirmado** (vía `POST /api/actions/invest`, `buy_junior` 5 CSPR — la acción
     más barata, para minimizar gasto de esta prueba puntual): `exitCode:0`, deploy
     `8d3fa89e...9397e5d46` SUCCESS, escrito a `run-log.json`. `GET /api/chain/state` inmediatamente
     después mostró `investorHoldingJuniorCspr` en 15 (10+5) — confirma el camino completo botón
     → ruta API → `child_process.spawn` → script real → tx real → log → estado en vivo actualizado.
     **Bug encontrado en el camino:** el `413` intermitente del RPC público (ver punto 2) reapareció
     incluso con lecturas secuenciales — es un blip transitorio real del endpoint (confirmado:
     reintentar segundos después siempre funciona), no un bug de concurrencia nuestro. Fix
     definitivo: retry con backoff corto (3 intentos, 400ms×intento) en `readDictionaryValue` —
     probado 4/4 exitoso después del fix.
- [x] **Paso 12 — COMPLETO:** pase de diseño con `/ui-ux-pro-max:ui-ux-pro-max` sobre el dashboard
      ya conectado a datos reales. Riel numerado 01-04 (jerarquía del arco de la demo), números en
      vivo en JetBrains Mono como protagonistas, banner de solo-lectura de Vercel integrado al
      `SiteHeader`, estado de espera honesto (`BusyStatusBar`: cronómetro real + mensajes por
      umbral de tiempo, no un progreso fabricado).
- [x] **Paso 13 — COMPLETO:** `Background3D.tsx` reactivo a eventos reales — pulso al pagar
      x402/stakear/invertir, enlace que se ilumina hacia el hub de AttestationRegistry al atestar,
      nodo que flashea blanco y se apaga permanentemente a carbón en el slashing. Respeta
      `prefers-reduced-motion` y degrada a fondo estático si no hay WebGL o el hardware es débil.

### Fase C.1 — Pases de pulido adicionales (post Paso 13, pre Paso 14)

Tres rondas de pulido visual/UX pedidas por el usuario después del Paso 13, antes de pasar al dry
run. Documentadas acá porque no había un "Paso" numerado que las cubriera:

- [x] **Identidad Casper (rojo neón/negro) + logo original v1:** retema completo de la paleta
      (fondo `#0A0A0A`, rojo Casper `#FF1F1F` como marca/acento, `senior`=cromo/blanco,
      `junior`=ember, tono `carbon` dedicado exclusivamente al momento del slash — la tarjeta/nodo
      del castigado se desatura a gris, no se pone "más rojo"). Logo v1: hexágono wireframe propio
      (SVG) partido en mitad senior/blanco arriba y junior/rojo abajo. `Background3D` re-coloreado
      a rojo ember + cubos wireframe flotando.
- [x] **Pulido final de interfaz:** sección Hero en inglés (headline + thesis + badges de stack
      x402/Gemini/Casper Testnet) arriba del riel — jurado internacional. Animaciones (`CountUp`
      con glow-pulse, `RevealOnMount` escalonado, hover con micro-elevación, feed con slide-in
      escalonado sin re-animar en cada poll). Iconografía por concepto (conservador=escudo,
      agresivo=llama, atestación=sello, stake=candado). Tooltips accesibles (hover+foco) para
      términos técnicos (x402, tramo senior/junior, slashing, stake) + copy-to-click en hashes.
- [x] **Logo real + fix de overflow + profundidad visual + i18n ES/EN:** el hexágono SVG se
      reemplazó por el logo real "Logo MouSPT" (recortado en círculo, zoom al centro para ocultar
      las marcas de agua del original — `public/logo-source.png` conserva el original,
      `public/logo.png`/`app/icon.png` son las versiones optimizadas). Auditoría sistemática de
      overflow con Playwright en 1440/768/390px: encontró y arregló 3 bugs reales (tooltip
      causando scroll horizontal en mobile por quedar montado con `opacity-0`, un stat
      desbordándose en tablet por un breakpoint de grid prematuro, el glow del hero sangrando
      horizontalmente). Profundidad visual tipo Linear/Vercel: gradientes + highlight superior en
      `Card`, separador degradado bajo cada header, glassmorphism más fuerte en el header sticky,
      esquinas HUD en las tarjetas clave. **Selector de idioma ES/EN** en el header — diccionario
      propio (`lib/i18n/`, sin librería), estado en memoria + query param `?lang=` (sin
      localStorage), default inglés, TODO el texto de UI traducido (el razonamiento de los LLM en
      `run-log.json` se deja intacto por ser dato real). Tema claro evaluado con una prueba visual
      real y **descartado a propósito** — el look wireframe/glow depende del fondo casi negro; el
      video se graba en oscuro.
      **Los 3 pases verificados con `tsc`/`npm run build` limpios + Playwright en 1440/768/390px
      antes de cada commit.** Sin cambios en capa de datos ni rutas API en ninguno de los 3.

## Pendientes — Fase D: Cierre

- [ ] **Paso 14 — EN CURSO:** dry run completo de la demo con tx reales, de principio a fin.
      Facilitator (`:4022`), resource server (`:4021`) y dev server (`:3000`) confirmados arriba.
      Guion de grabación bilingüe (EN/ES) entregado con costo estimado por wallet y balance
      real leído on-chain (bottleneck: wallet `investor`, ~1 toma limpia de margen). **Falta:** que
      el usuario corra el dry run real con `invoice-batch-003` y confirmar que nada truena antes
      de la toma final.
- [ ] **Paso 15:** README final (arquitectura, tabla de contratos con links, cómo correr todo,
      walkthrough, plan a largo plazo) + reporte de sesión. Después: correr
      `Mou-Casper-Fase2-Auditoria.md` completo.

## Auditoría de seguridad (git + secretos) — ejecutada

- [x] `.gitignore` correcto: incluye `keys/`, `*.pem`, `*_secret_key.pem`, `*_public_key.pem`,
      `.env`, `.env.local`.
- [x] `git log --all` → **"No commits yet"**: el repo NO tiene ningún commit todavía, así que no
      hay historial del que algo se haya podido colar.
- [x] `git status` confirma que `keys/`, `node_modules/`, `.env` NO aparecen ni como untracked
      (correctamente ignorados) — solo aparecen archivos de código/config normales.
- [x] `git ls-files` (tracked) no devuelve nada — coherente con que no hay commits.
- **Veredicto: sin riesgo actual.** Nada sensible se ha commiteado porque no se ha commiteado
  nada aún. **Punto de vigilancia real:** el PRIMER commit que se haga — no usar `git add -A` /
  `git add .` a ciegas; añadir archivos por nombre y confirmar con `git status` antes de commitear
  que `keys/` y `.env` (y el futuro `CSPR_CLOUD_API_KEY` del Paso 9) no aparezcan en el diff.

## Tareas humanas pendientes (no simulables)

- [ ] Fondear la wallet desde el faucet de Casper Testnet (captcha).
- [ ] Grabar el video demo.
- [ ] Registrar `appId` en `console.cspr.build` si se usa CSPR.click en producción (no aplica en
      localhost, ahí sirve `csprclick-template`).
- [ ] Conseguir `CSPR_CLOUD_API_KEY` para conectar el Casper MCP Server (Paso 9) — no commitear,
      va en `.env` (ya gitignored).
- [ ] Confirmar con el organizador (Telegram) el mecanismo de uso patrocinado de x402 para el
      equipo (Paso 6.2).
- [ ] **Borrar la `GEMINI_API_KEY` actual en AI Studio y crear una nueva al terminar el
      buildathon** — quedó pegada en la conversación con la IA (higiene, no hay riesgo real ya
      que el tier gratuito no tiene tarjeta asociada, pero es buena práctica).

# AVAL / Mou Casper — Reporte de sesión

> Casper Agentic Buildathon 2026 — Casper Innovation Track (Agentic AI + DeFi + RWA)
> Repo: [github.com/ALFA117/Mou-Casper](https://github.com/ALFA117/Mou-Casper)

## Resumen ejecutivo

AVAL es la mesa de titularización (securitization desk) autónoma para la economía de agentes:
dos agentes underwriter (uno conservador, uno agresivo) pagan de verdad por datos de riesgo vía
x402, cotizan el mismo activo del mundo real con un LLM real (Gemini), apuestan CSPR real
detrás de su propia opinión, y quedan **slasheados on-chain, en vivo**, cuando el que
subestimó el riesgo resulta equivocado. Detalle completo de arquitectura, contratos desplegados
y cómo correrlo tú mismo: [`README.md`](./README.md).

## Qué se entrega

- **Prototipo funcional en Casper Testnet** con componente on-chain que produce transacciones
  reales: 5 contratos Odra + `hello.wasm`, todos desplegados con `status: success` (tabla completa
  en el README).
- **Repo open-source** (GitHub) con README documentado — arquitectura, tabla de contratos con
  links a CSPR.live, cómo correrlo, walkthrough, y plan a largo plazo.
- **Bitácora de ingeniería completa y pública**: [`tareas.md`](./tareas.md) — cada bug real, cada
  fix, cada costo real en CSPR, sin curar.
- **Video demo**: pendiente de grabar (bloqueado por el Paso 14, ver "Estado actual" abajo).

## Qué se construyó

- 5 contratos Odra (Rust/WASM): `Constitution` (límites duros que los agentes no pueden violar),
  `Reputation`, `UnderwriterStake`, `AttestationRegistry`, `TrancheVault`.
- Facilitator + resource server x402 propios (`/x402-service`), vendiendo datos de riesgo reales
  cobrados en WCSPR, liquidados on-chain con los paquetes oficiales de `casper-x402`.
- Dos Underwriter Agents que compiten con el mismo código, parametrizados por perfil de riesgo
  (`conservative` / `aggressive`) inyectado en el prompt del LLM — la discrepancia entre ambos
  nace del prompt, no de números hardcodeados.
- Investor Agent que compra tramos senior/junior.
- Servicer/Monitor Agent: el clímax — marca un default simulado, la cascada golpea primero al
  tramo junior, se le hace `slash()` al underwriter que subestimó el riesgo (bps calculado desde
  su cotización real vs. el spread real de mercado), se penaliza/recompensa reputación.
- `demo:run`: el arco completo de arriba, end-to-end, en un solo comando, incluyendo una prueba
  deliberada de que `Constitution` revierte cuando se exceden los límites de exposición.
- Dashboard Next.js que lee estado real on-chain (sin mocks) y dispara los scripts reales de los
  agentes desde la UI, con identidad visual propia (rojo/negro Casper), fondo 3D reactivo a
  eventos reales, i18n ES/EN, y una demo pública vía Cloudflare Tunnel donde cualquiera puede
  disparar transacciones reales firmadas por las wallets del propio proyecto.

## Decisiones técnicas y lecciones (las que un jurado preguntaría)

Versión completa en el README ("Hard-won lessons") y en `tareas.md`. Los puntos más caros de
descubrir:

- El bloqueador real para compilar los contratos no fue `invalid pricing mode` (el error que
  otros equipos reportaron) sino `Bulk memory operations are not supported` — faltaban
  Binaryen/WABT para que el paso de lowering de `cargo-odra` corriera de verdad.
- `casper-js-sdk`'s `CLValue.newCLString` mide la longitud con `.length` de JS (UTF-16) en vez de
  bytes UTF-8 reales, corrompiendo cualquier string con tildes al deserializarse on-chain — se
  encontró porque el razonamiento en español de Underwriter B tumbaba `attest()` con un
  `User error: 64649` opaco.
- Casper reembolsa el gas no usado y al principio no lo estábamos leyendo — el costo real neto de
  una llamada resultó ser ~3–6 CSPR, no los 15 CSPR presupuestados.
- Sin WSL2/Docker: `casper-client` (Rust CLI) no compila en Windows nativo, así que todo el
  armado/firma/envío de deploys se hizo con `casper-js-sdk` (JS puro).

## Estado actual (2026-07-25)

- **Fases A, B y C — completas.** Los 5 contratos + `hello.wasm` en testnet, los 3 agentes y el
  orquestador `demo:run` funcionando end-to-end, dashboard con datos 100% reales y pase de diseño
  completo (identidad Casper, i18n, fondo 3D reactivo, demo pública).
- **Fase D (Paso 14) — en curso, bloqueada por un bug externo.** El dry run completo con
  transacciones reales pasa en todos sus pasos (register/stake/attest de ambos underwriters,
  compra de tramos del investor, reversión de `Constitution`) **excepto el pago x402**, que falla
  liquidando contra el contrato WCSPR *compartido* de testnet (`User error: 64658`). Investigado a
  fondo del lado propio — no es balance, no es nonce/ventana de tiempo, no es un mismatch de
  versión de contrato — y confirmado con el organizador (Telegram) que es un problema conocido de
  su lado, en proceso de arreglo. Efecto en cascada ya blindado: cuando el feed de riesgo no
  llega, el paso de slashing ahora falla limpio con un mensaje claro en vez de reventar con un
  error críptico de `BigNumber` (commit `24fde6f`).
- **Paso 15 — en curso.** README actualizado con estado real + plan a largo plazo (commit
  `17db9ae`); este reporte de sesión es la segunda mitad. Falta cerrar Paso 14 y grabar el video
  antes de poder llamar esto "terminado".

## Plan a largo plazo

Versión completa en el README ("Long-term plan"). El MVP se recortó a propósito (1 tipo de RWA,
2 underwriters, 2 tramos, sin DEX en vivo — ver `Mou-Casper.md` §7). Después del buildathon: más
tipos de RWA sobre el mismo patrón de contratos, swarms de más underwriters (cambio de config, no
de contrato), mercado secundario de tramos (necesita liquidez DEX real, solo viable en mainnet),
y despliegue a mainnet condicionado a una auditoría de seguridad externa de los 5 contratos —
`Constitution` y `UnderwriterStake.slash()` son los dos entry points que moverían fondos reales.

## Próximos pasos

1. Esperar confirmación del organizador de que el fix de WCSPR ya está vivo en testnet.
2. Re-correr `demo:run` completo de punta a punta sin bloqueos.
3. Grabar el video demo (guion bilingüe EN/ES ya entregado).
4. Correr `Mou-Casper-Fase2-Auditoria.md` (pendiente de definir su alcance — no existe todavía).

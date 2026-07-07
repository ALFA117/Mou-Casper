import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import casperSdk from 'casper-js-sdk';
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from '@x402/fetch';
import { createClientCasperSigner } from '@make-software/casper-x402';
import { ExactCasperScheme } from '@make-software/casper-x402/exact/client';
import { appendRunLog } from './run-log.mjs';

const {
  PrivateKey,
  KeyAlgorithm,
  HttpHandler,
  RpcClient,
  SessionBuilder,
  ContractCallBuilder,
  Args,
  CLValue,
  CLTypeUInt8,
  Key
} = casperSdk;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const RPC_URL = process.env.CASPER_NODE_RPC_URL;
export const CHAIN_NAME = 'casper-test';
export const KEYS_DIR = path.join(__dirname, '..', 'keys');
export const PROXY_CALLER_WASM_PATH = path.join(__dirname, '..', 'scripts', 'wasm-tools', 'proxy_caller_with_return.wasm');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Modelos de Gemini (tier gratuito). Cuota verificada con una llamada barata
// (agents/test-gemini-key.js) el 2026-07-07 con la key actual de esta cuenta:
//   - gemini-2.5-flash        (PRIMARIO)    -> cuota OK
//   - gemini-2.5-flash-lite   (FALLBACK #1) -> cuota OK
//   - gemini-2.0-flash-lite   (FALLBACK #2) -> cuota 0 (HTTP 429 en la prueba),
//     se deja como ultimo recurso por si la cuota se libera despues.
// gemini-2.0-flash (sin "-lite") quedo con cuota 0 en el tier gratuito
// (probado 2026-07-05) y no se usa en absoluto.
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
const X402_RESOURCE_SERVER_URL = process.env.X402_RESOURCE_SERVER_URL || 'http://localhost:4021';

const REPUTATION_PACKAGE_HASH = process.env.REPUTATION_CONTRACT_HASH;
const UNDERWRITER_STAKE_PACKAGE_HASH = process.env.UNDERWRITER_STAKE_CONTRACT_HASH;
const ATTESTATION_REGISTRY_PACKAGE_HASH = process.env.ATTESTATION_REGISTRY_CONTRACT_HASH;

// --- utilidades compartidas con scripts/call-payable.js y call-entry-point.js ---

export function hashHexToBytes(hashHex) {
  const clean = hashHex.replace(/^hash-/, '');
  return Uint8Array.from(Buffer.from(clean, 'hex'));
}

export function bytesToCLBytesList(bytes) {
  return CLValue.newCLList(CLTypeUInt8, Array.from(bytes).map(b => CLValue.newCLUint8(b)));
}

export function loadKey(walletName) {
  const secretKeyPem = fs.readFileSync(path.join(KEYS_DIR, `${walletName}_secret_key.pem`), 'utf8');
  return PrivateKey.fromPem(secretKeyPem, KeyAlgorithm.ED25519);
}

export function accountKeyFromWallet(walletName) {
  const pk = loadKey(walletName);
  return Key.newKey(pk.publicKey.accountHash().toPrefixedString());
}

export function printExecutionResult(label, deployHashHex, result) {
  const execInfo = result.executionInfo;
  const errorMessage = execInfo ? execInfo.executionResult.errorMessage : undefined;
  const success = execInfo ? !errorMessage : undefined;
  const cost = execInfo ? execInfo.executionResult.cost : undefined;
  console.log(`  [${label}] deploy ${deployHashHex} -> ${success ? 'SUCCESS' : 'FAILURE'} (${cost} motes)`);
  if (!success) console.log(`  [${label}] error:`, errorMessage);
  console.log(`  [${label}] https://testnet.cspr.live/deploy/${deployHashHex}`);
  return { success, cost, deployHashHex };
}

// --- Paso 1: pagar x402 por los datos de riesgo -----------------------------

export async function payForRiskData(walletName, assetId) {
  const pk = loadKey(walletName);
  const secretKeyPath = path.join(KEYS_DIR, `${walletName}_secret_key.pem`);
  const casperSigner = await createClientCasperSigner(secretKeyPath, KeyAlgorithm.ED25519);
  const client = new x402Client().register('casper:*', new ExactCasperScheme(casperSigner));
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  const url = `${X402_RESOURCE_SERVER_URL}/risk-data?assetId=${assetId}`;
  const response = await fetchWithPayment(url, { method: 'GET' });
  const riskData = await response.json();

  const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(name => response.headers.get(name));
  return { riskData, paymentResponse, payerHex: pk.publicKey.toHex() };
}

// --- Paso 2: cotizar con Gemini real (tier gratuito) -------------------------

// Perfiles de riesgo: la diferencia entre agentes tiene que salir del criterio
// que se le da al LLM, no de forzar numeros distintos a mano (Paso 8, regla del
// usuario). Cada perfil es una filosofia de underwriting real y opuesta.
export const RISK_PROFILES = {
  conservative: {
    label: 'CONSERVADOR',
    instructions: `Eres un underwriter CONSERVADOR. Tu prioridad absoluta es proteger el capital
de los inversionistas de senior/junior por encima de maximizar tu propio yield o volumen de
negocio. Trata la probabilidad de default reportada por el feed como un PISO, no como el numero
final — los feeds de riesgo de terceros suelen subestimar el tail risk y la correlacion de
defaults en escenarios de estres, asi que aplica un margen de precaucion adicional al evaluarla.
Prefieres fuertemente el tramo senior. Exiges spreads generosos como compensacion incluso ante
riesgo moderado-bajo, porque prefieres perder una operacion competitiva a quedar mal cubierto.
Tus ratings tienden a ser mas bajos que el promedio del mercado para el mismo activo, reflejando
este colchon de precaucion adicional que le sumas a los datos crudos.`
  },
  aggressive: {
    label: 'AGRESIVO/OPTIMISTA',
    instructions: `Eres un underwriter AGRESIVO Y OPTIMISTA que compite activamente por ganar
volumen de negocio ofreciendo las condiciones mas competitivas del mercado. Priorizas maximizar
tu yield y tu cuota de mercado por encima de la cautela excesiva. Consideras que los feeds de
riesgo de terceros YA incorporan de sobra el margen de seguridad necesario — de hecho, piensas
que el mercado en general tiende a SOBRESTIMAR el riesgo real de este tipo de activos (facturas
corporativas de corto plazo), asi que no le sumas ningun colchon adicional a los datos reportados,
y si acaso los tomas con optimismo. Prefieres el tramo junior por su mayor yield cuando el activo
lo permite. Ofreces spreads mas bajos y agresivos para ganarle el negocio a competidores mas
conservadores. Tus ratings tienden a ser mas altos (mas optimistas) que el promedio del mercado
para el mismo activo, porque confias en que el riesgo real es menor al reportado.`
  }
};

const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    rating: { type: 'INTEGER', description: '0-1000, donde 1000 es riesgo minimo' },
    recommended_tranche: { type: 'STRING', enum: ['senior', 'junior'] },
    price_bps: { type: 'INTEGER', description: 'spread de suscripcion sugerido, en basis points' },
    short_reasoning: { type: 'STRING', description: 'maximo 500 caracteres, va ON-CHAIN literalmente' },
    extended_reasoning: { type: 'STRING', description: 'razonamiento completo, NO va on-chain, solo se hashea' }
  },
  required: ['rating', 'recommended_tranche', 'price_bps', 'short_reasoning', 'extended_reasoning']
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Se reintenta ante: 429 (rate limit), 503 (servidor saturado -- el caso real
// que tumbo una corrida de demo el 2026-07-07 con "high demand") y errores de
// red (DNS/timeout/conexion resetada, que fetch() de Node lanza como
// excepcion en vez de devolver una response con status).
const RETRYABLE_STATUS = new Set([429, 503]);
const BACKOFF_SECONDS = [5, 15, 30, 60];

function isRetryableNetworkError(err) {
  return err instanceof TypeError || ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(err.code);
}

async function callGeminiModel(model, prompt, maxAttempts) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: GEMINI_RESPONSE_SCHEMA
    }
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      if (attempt === maxAttempts || !isRetryableNetworkError(err)) throw err;
      const waitSeconds = BACKOFF_SECONDS[attempt - 1] ?? BACKOFF_SECONDS[BACKOFF_SECONDS.length - 1];
      console.log(`   Gemini saturado (${model}, error de red: ${err.message}) - reintentando en ${waitSeconds}s (intento ${attempt}/${maxAttempts})...`);
      await sleep(waitSeconds * 1000);
      continue;
    }

    if (RETRYABLE_STATUS.has(res.status)) {
      if (attempt === maxAttempts) {
        throw new Error(`Gemini API (${model}) error ${res.status} tras agotar los ${maxAttempts} intentos`);
      }
      const retryAfterHeader = res.status === 429 ? res.headers.get('retry-after') : null;
      const waitSeconds = retryAfterHeader ? Number(retryAfterHeader) : (BACKOFF_SECONDS[attempt - 1] ?? BACKOFF_SECONDS[BACKOFF_SECONDS.length - 1]);
      console.log(`   Gemini saturado (${model}, HTTP ${res.status}) - reintentando en ${waitSeconds}s (intento ${attempt}/${maxAttempts})...`);
      await sleep(waitSeconds * 1000);
      continue;
    }

    if (!res.ok) {
      // No incluir headers de la request en el error (evitar filtrar la API key).
      const errText = await res.text();
      throw new Error(`Gemini API (${model}) error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates[0].content.parts.map(p => p.text || '').join('');
    return JSON.parse(text);
  }

  throw new Error(`Gemini API (${model}): se agotaron los reintentos`);
}

// Llamada minima (prompt trivial, sin schema) solo para saber si esta cuenta
// tiene cuota en `model` antes de gastar tokens del prompt real de underwriting.
async function probeModelQuota(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'OK' }] }] })
    });
    return res.ok;
  } catch {
    return false;
  }
}

// La ruta run-underwriter tiene maxDuration=300s (limite del plan Hobby de
// Vercel, ver commit 922ffc1) y register/stake/attest tambien consumen ese
// presupuesto de tiempo. El primario usa el retry completo pedido (hasta 5
// intentos, backoff 5/15/30/60s -> ~110s en el peor caso); los fallbacks usan
// un presupuesto mas corto porque ese tiempo ya se gasto en el primario.
const PRIMARY_MAX_ATTEMPTS = 5;
const FALLBACK_MAX_ATTEMPTS = 2;

export async function callGeminiWithRetry(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada en .env');
  }

  try {
    return await callGeminiModel(GEMINI_MODEL, prompt, PRIMARY_MAX_ATTEMPTS);
  } catch (primaryError) {
    console.log(`   Gemini (${GEMINI_MODEL}) no disponible tras ${PRIMARY_MAX_ATTEMPTS} intentos (${primaryError.message}). Probando modelos de fallback...`);

    for (const fallbackModel of GEMINI_FALLBACK_MODELS) {
      console.log(`   Verificando cuota de ${fallbackModel} con una llamada barata...`);
      const hasQuota = await probeModelQuota(fallbackModel);
      if (!hasQuota) {
        console.log(`   ${fallbackModel} sin cuota disponible en esta cuenta, probando siguiente...`);
        continue;
      }
      console.log(`   Cuota OK en ${fallbackModel} - usandolo como fallback (mismo JSON schema, transparente para el resto del flujo).`);
      try {
        return await callGeminiModel(fallbackModel, prompt, FALLBACK_MAX_ATTEMPTS);
      } catch (fallbackError) {
        console.log(`   Fallback ${fallbackModel} tambien fallo (${fallbackError.message}), probando siguiente...`);
      }
    }

    throw new Error(`Gemini no disponible: primario ${GEMINI_MODEL} y todos los fallbacks (${GEMINI_FALLBACK_MODELS.join(', ')}) fallaron. Ultimo error del primario: ${primaryError.message}`);
  }
}

export async function quoteWithGemini(assetId, riskData, profileKey) {
  const profile = RISK_PROFILES[profileKey];
  if (!profile) {
    throw new Error(`Perfil de riesgo desconocido: ${profileKey}. Validos: ${Object.keys(RISK_PROFILES).join(', ')}`);
  }

  const prompt = `Eres un agente asegurador (underwriter) autonomo de AVAL, un protocolo de securitizacion de facturas (invoices) en Casper Network. Tu trabajo es evaluar un batch de facturas y emitir una cotizacion.

${profile.instructions}

Datos de riesgo comprados via x402 para el activo "${assetId}":
${JSON.stringify(riskData, null, 2)}

Emite tu cotizacion siguiendo exactamente el schema JSON solicitado, aplicando fielmente tu perfil de underwriting (${profile.label}) al interpretar estos datos. IMPORTANTE: "short_reasoning" debe estar en texto plano ASCII (sin tildes ni enies, ej. "diseno" en vez de "diseño") porque se guarda tal cual en un contrato on-chain con una limitacion de codificacion conocida; "extended_reasoning" si puede llevar acentos normales.`;

  const quote = await callGeminiWithRetry(prompt);

  // Red de seguridad: casper-js-sdk 5.0.12 tiene un bug donde CLValue.newCLString
  // calcula el prefijo de longitud con .length de JS (UTF-16) en vez de bytes UTF-8
  // reales -- con acentos (2 bytes en UTF-8, 1 en UTF-16) el string queda corrupto
  // en cadena. Se le pide ASCII al LLM arriba, pero por si acaso se transllitera
  // aqui tambien antes de que "short_reasoning" vaya on-chain en attest().
  quote.short_reasoning = quote.short_reasoning.normalize('NFD').replace(/[̀-ͯ]/g, '');

  if (quote.short_reasoning.length > 500) {
    quote.short_reasoning = quote.short_reasoning.slice(0, 497) + '...';
  }
  return quote;
}

// --- Paso 3: register() (idempotente, owner-only -> firma servicer) --------

export async function registerUnderwriter(underwriterWalletName) {
  const servicerKey = loadKey('servicer');
  const runtimeArgs = Args.fromMap({
    underwriter: CLValue.newCLKey(accountKeyFromWallet(underwriterWalletName))
  });

  const transaction = new ContractCallBuilder()
    .from(servicerKey.publicKey)
    .byPackageHash(REPUTATION_PACKAGE_HASH.replace(/^hash-/, ''))
    .entryPoint('register')
    .runtimeArgs(runtimeArgs)
    .chainName(CHAIN_NAME)
    .payment(15_000_000_000)
    .buildFor1_5();

  transaction.sign(servicerKey);
  const deploy = transaction.getDeploy();

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  await rpcClient.putDeploy(deploy);
  const result = await rpcClient.waitForDeploy(deploy, 180000);
  return printExecutionResult('register', deploy.hash.toHex(), result);
}

// --- Paso 4: stake() (payable, via proxy caller) ----------------------------

export async function stake(underwriterWalletName, amountCspr) {
  const privateKey = loadKey(underwriterWalletName);
  const wasmBytes = new Uint8Array(fs.readFileSync(PROXY_CALLER_WASM_PATH));
  const attachedValueMotes = Math.round(amountCspr * 1_000_000_000);

  const targetArgsBytes = Args.fromMap({}).toBytes();
  const proxyArgs = Args.fromMap({
    package_hash: CLValue.newCLByteArray(hashHexToBytes(UNDERWRITER_STAKE_PACKAGE_HASH)),
    entry_point: CLValue.newCLString('stake'),
    args: bytesToCLBytesList(targetArgsBytes),
    attached_value: CLValue.newCLUInt512(String(attachedValueMotes)),
    amount: CLValue.newCLUInt512(String(attachedValueMotes))
  });

  const transaction = new SessionBuilder()
    .from(privateKey.publicKey)
    .wasm(wasmBytes)
    .runtimeArgs(proxyArgs)
    .chainName(CHAIN_NAME)
    .payment(40_000_000_000)
    .buildFor1_5();

  transaction.sign(privateKey);
  const deploy = transaction.getDeploy();

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  await rpcClient.putDeploy(deploy);
  const result = await rpcClient.waitForDeploy(deploy, 180000);
  return printExecutionResult('stake', deploy.hash.toHex(), result);
}

// --- Paso 5: attest() (no-payable, directo) ---------------------------------

export async function attest(underwriterWalletName, assetId, quote, reasoningHash, feedsUsed) {
  const privateKey = loadKey(underwriterWalletName);
  const runtimeArgs = Args.fromMap({
    asset_id: CLValue.newCLString(assetId),
    rating: CLValue.newCLUInt32(quote.rating),
    reasoning_hash: CLValue.newCLString(reasoningHash),
    reasoning: CLValue.newCLString(quote.short_reasoning),
    feeds_used: CLValue.newCLString(feedsUsed)
  });

  const transaction = new ContractCallBuilder()
    .from(privateKey.publicKey)
    .byPackageHash(ATTESTATION_REGISTRY_PACKAGE_HASH.replace(/^hash-/, ''))
    .entryPoint('attest')
    .runtimeArgs(runtimeArgs)
    .chainName(CHAIN_NAME)
    .payment(15_000_000_000)
    .buildFor1_5();

  transaction.sign(privateKey);
  const deploy = transaction.getDeploy();

  const rpcClient = new RpcClient(new HttpHandler(RPC_URL));
  await rpcClient.putDeploy(deploy);
  const result = await rpcClient.waitForDeploy(deploy, 180000);
  return printExecutionResult('attest', deploy.hash.toHex(), result);
}

// --- Loop completo (exportado para que demo-run.mjs lo componga) ------------

export async function runUnderwriterLoop({ walletName, assetId, stakeAmountCspr, profileKey, mode = 'full' }) {
  console.log(`\n=== Underwriter Agent (${walletName}, perfil ${profileKey}) — activo: ${assetId} ===\n`);

  console.log('1) Pagando x402 por datos de riesgo...');
  const { riskData, paymentResponse } = await payForRiskData(walletName, assetId);
  console.log('   Datos de riesgo:', riskData);
  console.log('   Pago x402:', paymentResponse);
  if (paymentResponse && paymentResponse.transaction) {
    console.log(`   https://testnet.cspr.live/deploy/${paymentResponse.transaction}`);
  }

  console.log(`\n2) Cotizando con Gemini (perfil ${profileKey}, LLM real, tier gratuito)...`);
  let quote;
  try {
    quote = await quoteWithGemini(assetId, riskData, profileKey);
  } catch (err) {
    // El pago x402 del paso 1 ya se ejecuto -- riskData es insumo del prompt
    // de Gemini, asi que el orden pago-antes-que-LLM no se puede invertir sin
    // romper el flujo. Si Gemini sigue caido tras agotar reintentos + los dos
    // fallbacks, el CSPR de ese pago x402 ya se gasto y NO hay reembolso
    // automatico. Se deja constancia en el run log (en vez de perderse en un
    // stacktrace) para que quede visible en el dashboard/historial.
    appendRunLog({
      type: 'underwriter_failed_after_payment',
      walletName,
      assetId,
      profileKey,
      stakeAmountCspr,
      riskData,
      hashes: { x402: paymentResponse?.transaction || null },
      error: err.message,
      success: false
    });
    throw new Error(`Gemini fallo tras agotar reintentos y fallbacks; el pago x402 de este run (deploy ${paymentResponse?.transaction || 'N/A'}) ya se ejecuto y no se reembolsa automaticamente. Detalle: ${err.message}`);
  }
  console.log('   Cotizacion del LLM:', JSON.stringify(quote, null, 2));

  const reasoningHash = crypto.createHash('sha256').update(quote.extended_reasoning).digest('hex');
  console.log('   Hash del razonamiento extendido (sha256):', reasoningHash);

  if (mode === 'quote-only') {
    console.log('\n(modo quote-only: no se ejecuta register/stake/attest)');
    return { riskData, paymentResponse, quote, reasoningHash };
  }

  console.log('\n3) Registrando underwriter en Reputation (servicer firma, idempotente)...');
  const registerResult = await registerUnderwriter(walletName);

  console.log(`\n4) Apostando stake (${stakeAmountCspr} CSPR) en UnderwriterStake...`);
  const stakeResult = await stake(walletName, stakeAmountCspr);

  console.log('\n5) Atestando en AttestationRegistry...');
  const attestResult = await attest(walletName, assetId, quote, reasoningHash, riskData.source || 'aval-risk-feed-v1');

  console.log('\n=== RESUMEN DE LA CORRIDA ===');
  console.log('Pago x402:      ', paymentResponse ? paymentResponse.transaction : 'N/A');
  console.log('Register:       ', registerResult.deployHashHex, registerResult.success ? 'SUCCESS' : 'FAILURE');
  console.log('Stake:          ', stakeResult.deployHashHex, stakeResult.success ? 'SUCCESS' : 'FAILURE');
  console.log('Attest:         ', attestResult.deployHashHex, attestResult.success ? 'SUCCESS' : 'FAILURE');
  console.log('Cotizacion LLM: ', JSON.stringify(quote));

  appendRunLog({
    type: 'underwriter',
    walletName,
    assetId,
    profileKey,
    stakeAmountCspr,
    riskData,
    quote,
    reasoningHash,
    hashes: {
      x402: paymentResponse?.transaction || null,
      register: registerResult.deployHashHex,
      stake: stakeResult.deployHashHex,
      attest: attestResult.deployHashHex
    },
    success: Boolean(registerResult.success && stakeResult.success && attestResult.success)
  });

  return { riskData, paymentResponse, quote, reasoningHash, registerResult, stakeResult, attestResult };
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  const walletName = process.argv[2] || 'underwriter_A';
  const assetId = process.argv[3] || 'invoice-batch-001';
  const stakeAmountCspr = Number(process.argv[4] || 15);
  const profileKey = process.argv[5] || 'conservative';
  const mode = process.argv[6] || 'full';

  runUnderwriterLoop({ walletName, assetId, stakeAmountCspr, profileKey, mode }).catch(err => {
    console.error('\n=== ERROR ===');
    console.error(err);
    process.exit(1);
  });
}

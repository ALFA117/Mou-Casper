import assert from 'node:assert/strict';
import { callGeminiWithRetry } from './underwriter-agent.mjs';

/**
 * Prueba el blindaje contra el 503 "high demand" de Gemini que tumbo una
 * corrida real el 2026-07-07: retry con backoff + fallback de modelo.
 * Mockea SOLO global.fetch y global.setTimeout dentro de este archivo de
 * test -- underwriter-agent.mjs (produccion) sigue usando fetch/setTimeout
 * reales, esto no lo toca.
 */

const REAL_FETCH = global.fetch;
const REAL_SET_TIMEOUT = global.setTimeout;
const REAL_CONSOLE_LOG = console.log;

function speedUpTimers() {
  // El backoff real es 5/15/30/60s; para el test se colapsa a 0 pero se
  // mantiene la vuelta al event loop para no ocultar bugs de orden async.
  global.setTimeout = (fn, _ms, ...args) => REAL_SET_TIMEOUT(fn, 0, ...args);
}

function restoreTimers() {
  global.setTimeout = REAL_SET_TIMEOUT;
}

function captureLogs() {
  const lines = [];
  console.log = (...args) => lines.push(args.join(' '));
  return {
    lines,
    restore: () => { console.log = REAL_CONSOLE_LOG; },
  };
}

function jsonResponse(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const FAKE_QUOTE = {
  rating: 700,
  recommended_tranche: 'senior',
  price_bps: 250,
  short_reasoning: 'ok',
  extended_reasoning: 'ok extendido',
};

function geminiOkResponse(quote = FAKE_QUOTE) {
  return jsonResponse(200, {
    candidates: [{ content: { parts: [{ text: JSON.stringify(quote) }] } }],
  });
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  speedUpTimers();
  const { lines, restore } = captureLogs();
  try {
    await fn(lines);
    passed++;
    REAL_CONSOLE_LOG(`  PASS - ${name}`);
  } catch (err) {
    failed++;
    REAL_CONSOLE_LOG(`  FAIL - ${name}`);
    REAL_CONSOLE_LOG('   ', err.message);
  } finally {
    restore();
    restoreTimers();
    global.fetch = REAL_FETCH;
  }
}

// --- Escenario 1: 503 un par de veces y luego OK en el modelo primario -----
await test('503 intermitente en el primario se recupera sin fallback', async (lines) => {
  let calls = 0;
  global.fetch = async (url) => {
    calls++;
    if (calls <= 2) return jsonResponse(503, { error: 'high demand' });
    assert.match(url, /gemini-2\.5-flash:generateContent/);
    return geminiOkResponse();
  };

  const quote = await callGeminiWithRetry('prompt de prueba');
  assert.deepEqual(quote, FAKE_QUOTE);
  assert.equal(calls, 3, 'debe reintentar 2 veces y acertar en el 3er intento');
  const retryLines = lines.filter(l => l.includes('Gemini saturado') && l.includes('HTTP 503'));
  assert.equal(retryLines.length, 2);
  assert.match(retryLines[0], /reintentando en 5s \(intento 1\/5\)/);
  assert.match(retryLines[1], /reintentando en 15s \(intento 2\/5\)/);
});

// --- Escenario 2: error de red (excepcion de fetch) se reintenta -----------
await test('error de red se reintenta como los 503', async (lines) => {
  let calls = 0;
  global.fetch = async () => {
    calls++;
    if (calls === 1) throw new TypeError('fetch failed');
    return geminiOkResponse();
  };

  const quote = await callGeminiWithRetry('prompt de prueba');
  assert.deepEqual(quote, FAKE_QUOTE);
  assert.equal(calls, 2);
  assert.ok(lines.some(l => l.includes('error de red') && l.includes('intento 1/5')));
});

// --- Escenario 3: primario agota los 5 intentos -> cae a fallback ----------
await test('primario 503 x5 agotado cae al primer fallback con cuota', async (lines) => {
  const callsByModel = { 'gemini-2.5-flash': 0, 'gemini-2.5-flash-lite': 0 };
  global.fetch = async (url) => {
    if (url.includes('gemini-2.5-flash-lite')) {
      callsByModel['gemini-2.5-flash-lite']++;
      return geminiOkResponse();
    }
    if (url.includes('gemini-2.5-flash')) {
      callsByModel['gemini-2.5-flash']++;
      return jsonResponse(503, { error: 'high demand' });
    }
    throw new Error(`URL inesperada en el test: ${url}`);
  };

  const quote = await callGeminiWithRetry('prompt de prueba');
  assert.deepEqual(quote, FAKE_QUOTE);
  assert.equal(callsByModel['gemini-2.5-flash'], 5, 'primario debe agotar sus 5 intentos');
  // 1 probe barata + 1 llamada real con el prompt completo
  assert.equal(callsByModel['gemini-2.5-flash-lite'], 2);
  assert.ok(lines.some(l => l.includes('no disponible tras 5 intentos')));
  assert.ok(lines.some(l => l.includes('Cuota OK en gemini-2.5-flash-lite')));
});

// --- Escenario 4: primer fallback sin cuota (429), segundo fallback OK -----
await test('fallback sin cuota se salta y prueba el siguiente', async (lines) => {
  const seen = [];
  global.fetch = async (url) => {
    if (url.includes('gemini-2.5-flash-lite')) { seen.push('lite'); return jsonResponse(429, { error: 'quota' }); }
    if (url.includes('gemini-2.0-flash-lite')) { seen.push('2.0-lite'); return geminiOkResponse(); }
    if (url.includes('gemini-2.5-flash')) { seen.push('primary'); return jsonResponse(503, {}); }
    throw new Error(`URL inesperada: ${url}`);
  };

  const quote = await callGeminiWithRetry('prompt de prueba');
  assert.deepEqual(quote, FAKE_QUOTE);
  assert.equal(seen.filter(x => x === 'primary').length, 5);
  assert.equal(seen.filter(x => x === 'lite').length, 1, 'solo la probe barata, no debe gastar el prompt real en un modelo sin cuota');
  assert.ok(seen.includes('2.0-lite'));
  assert.ok(lines.some(l => l.includes('gemini-2.5-flash-lite sin cuota disponible')));
});

// --- Escenario 5: todo caido (primario + los 2 fallbacks) -> error claro ---
await test('todo caido lanza un error claro (sin reintentos infinitos)', async () => {
  global.fetch = async (url) => {
    if (url.includes('gemini-2.5-flash-lite') || url.includes('gemini-2.0-flash-lite')) return jsonResponse(503, {});
    return jsonResponse(503, {});
  };

  await assert.rejects(
    () => callGeminiWithRetry('prompt de prueba'),
    (err) => {
      assert.match(err.message, /Gemini no disponible: primario gemini-2\.5-flash y todos los fallbacks/);
      return true;
    }
  );
});

REAL_CONSOLE_LOG(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RUN_LOG_PATH = path.join(__dirname, 'run-log.json');

/**
 * Log de corridas REALES (no mock): cada entrada corresponde a transacciones
 * que de verdad se enviaron a Casper testnet. El dashboard (Paso 11) lee este
 * archivo para mostrar las cotizaciones/hashes mas recientes de cada agente,
 * en vez de tener que reconstruir el historial completo de AttestationRegistry
 * descubriendo una clave de diccionario por cada (id, campo) -- demasiadas
 * llamadas pagadas para lo que hace falta en esta fase.
 */
export function appendRunLog(record) {
  let log = [];
  try {
    log = JSON.parse(fs.readFileSync(RUN_LOG_PATH, 'utf8'));
  } catch {
    log = [];
  }
  log.push({ ...record, loggedAt: new Date().toISOString() });
  fs.writeFileSync(RUN_LOG_PATH, JSON.stringify(log, null, 2));
}

export function readRunLog() {
  try {
    return JSON.parse(fs.readFileSync(RUN_LOG_PATH, 'utf8'));
  } catch {
    return [];
  }
}

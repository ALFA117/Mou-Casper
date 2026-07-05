import { HttpHandler, RpcClient } from "casper-js-sdk";
import { RPC_URL, DICTIONARY_KEYS, type DictValueType } from "./chain-config";

let cachedClient: InstanceType<typeof RpcClient> | null = null;
function getClient() {
  if (!cachedClient) {
    // "axios" explicito: Next.js instrumenta/parcha el fetch global del
    // runtime de Node para su cache de datos, lo que rompe las respuestas
    // grandes de query_global_state (413 Payload Too Large) si se usa la
    // variante "fetch" del handler dentro de un route handler.
    cachedClient = new RpcClient(new HttpHandler(RPC_URL, "axios"));
  }
  return cachedClient;
}

function leBytesToBigInt(bytes: number[]): bigint {
  return bytes.reduceRight((acc, b) => acc * BigInt(256) + BigInt(b), BigInt(0));
}

// U512 (bignum variable-length): 1er byte = cantidad de bytes significativos
// que siguen (LE). Asi serializan stakes/montos Odra/Casper.
function decodeU512(byteArray: number[]): bigint {
  const len = byteArray[0];
  return leBytesToBigInt(byteArray.slice(1, 1 + len));
}

// U32 (tamano fijo): siempre 4 bytes LE, sin prefijo de longitud interno.
// Asi serializan Reputation.scores, por ejemplo.
function decodeU32(byteArray: number[]): bigint {
  return leBytesToBigInt(byteArray.slice(0, 4));
}

/**
 * Lee un valor de un Dictionary de Casper ya conocido (ver DICTIONARY_KEYS).
 * Gratis: no es una transaccion, es una lectura de estado global.
 *
 * El RPC publico de testnet devuelve "413 Payload Too Large" de forma
 * intermitente (cada respuesta trae un merkle_proof de ~40KB) -- es un blip
 * transitorio del endpoint, no un bug nuestro (confirmado: reintentar la
 * misma llamada segundos despues siempre funciona). Retry corto con backoff
 * en vez de dejar que la UI falle por esto.
 */
export async function readDictionaryValue(
  dictionaryKey: string,
  valueType: DictValueType,
  maxRetries = 3
): Promise<bigint> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = getClient();
      const result = await client.queryLatestGlobalState(dictionaryKey, []);
      const clValue = (result.rawJSON as any).stored_value.CLValue;
      if (!clValue?.cl_type || clValue.cl_type.List !== "U8") {
        throw new Error(`Valor inesperado en ${dictionaryKey}: ${JSON.stringify(clValue?.cl_type)}`);
      }
      return valueType === "U32" ? decodeU32(clValue.parsed) : decodeU512(clValue.parsed);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 400 * attempt));
      }
    }
  }
  throw lastError;
}

async function readNamed(name: keyof typeof DICTIONARY_KEYS): Promise<bigint> {
  const entry = DICTIONARY_KEYS[name];
  if (!entry) throw new Error(`No hay dictionary key configurada para "${name}"`);
  return readDictionaryValue(entry.key, entry.type);
}

export interface ChainState {
  underwriters: {
    underwriter_A: { stakeCspr: number; reputation: number };
    underwriter_B: { stakeCspr: number; reputation: number };
  };
  vault: {
    seniorOutstandingCspr: number;
    juniorOutstandingCspr: number;
    investorHoldingSeniorCspr: number;
    investorHoldingJuniorCspr: number;
  };
  readAt: string;
}

const MOTES_PER_CSPR = 1_000_000_000;

export async function readChainState(): Promise<ChainState> {
  // Secuencial, no Promise.all: 8 query_global_state en paralelo contra el RPC
  // publico de testnet disparaban "413 Payload Too Large" de forma intermitente
  // (cada respuesta trae un merkle_proof de ~40KB) -- uno a la vez es mas lento
  // pero confiable.
  const aStake = await readNamed("underwriterStake.stakes.underwriter_A");
  const bStake = await readNamed("underwriterStake.stakes.underwriter_B");
  const aScore = await readNamed("reputation.scores.underwriter_A");
  const bScore = await readNamed("reputation.scores.underwriter_B");
  const seniorOutstanding = await readNamed("trancheVault.seniorOutstanding");
  const juniorOutstanding = await readNamed("trancheVault.juniorOutstanding");
  const holdingSenior = await readNamed("trancheVault.holdingOfSenior.investor");
  const holdingJunior = await readNamed("trancheVault.holdingOfJunior.investor");

  return {
    underwriters: {
      underwriter_A: { stakeCspr: Number(aStake) / MOTES_PER_CSPR, reputation: Number(aScore) },
      underwriter_B: { stakeCspr: Number(bStake) / MOTES_PER_CSPR, reputation: Number(bScore) },
    },
    vault: {
      seniorOutstandingCspr: Number(seniorOutstanding) / MOTES_PER_CSPR,
      juniorOutstandingCspr: Number(juniorOutstanding) / MOTES_PER_CSPR,
      investorHoldingSeniorCspr: Number(holdingSenior) / MOTES_PER_CSPR,
      investorHoldingJuniorCspr: Number(holdingJunior) / MOTES_PER_CSPR,
    },
    readAt: new Date().toISOString(),
  };
}

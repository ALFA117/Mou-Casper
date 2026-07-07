import { NextResponse } from "next/server";
import { HttpHandler, RpcClient, PublicKey, PurseIdentifier } from "casper-js-sdk";
import { RPC_URL, WALLET_PUBLIC_KEYS } from "@/lib/server/chain-config";
import { getPublicDemoStatus } from "@/lib/server/demo-guard";

export const dynamic = "force-dynamic";

let cachedClient: InstanceType<typeof RpcClient> | null = null;
function getClient() {
  if (!cachedClient) {
    cachedClient = new RpcClient(new HttpHandler(RPC_URL, "axios"));
  }
  return cachedClient;
}

// El RPC publico de testnet devuelve "413 Payload Too Large" de forma
// intermitente (ver lib/server/casper-read.ts) -- mismo retry corto con
// backoff, no es un bug nuestro, reintentar segundos despues siempre funciona.
async function balanceCspr(publicKeyHex: string, maxRetries = 3): Promise<number> {
  const client = getClient();
  const pk = PublicKey.fromHex(publicKeyHex);
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await client.queryLatestBalance(PurseIdentifier.fromPublicKey(pk));
      return Number(result.rawJSON.balance) / 1_000_000_000;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 400 * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * Presupuesto de demo restante: suma del balance REAL (leido on-chain, no
 * estimado) de las 4 wallets que financian las acciones del dashboard, mas
 * el estado del guard (cooldown/tope horario) para esta misma request.
 * Secuencial, no Promise.all -- el RPC publico de testnet devuelve
 * intermitentemente 413 con lecturas paralelas (ver lib/server/casper-read.ts).
 */
export async function GET(req: Request) {
  try {
    let totalBalanceCspr = 0;
    for (const publicKeyHex of Object.values(WALLET_PUBLIC_KEYS)) {
      totalBalanceCspr += await balanceCspr(publicKeyHex);
    }

    return NextResponse.json({
      totalBalanceCspr,
      ...getPublicDemoStatus(req),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo presupuesto de demo" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { readChainState } from "@/lib/server/casper-read";

export const dynamic = "force-dynamic";

// La lectura son 8 query_global_state secuenciales contra el RPC publico de
// testnet, que falla seguido. s-maxage + stale-while-revalidate dejan que la
// CDN de Vercel sirva la ultima lectura buena (readAt dice cuando se hizo)
// mientras revalida por detras. Los errores nunca se cachean.
const CACHE_OK = "public, s-maxage=20, stale-while-revalidate=600";

export async function GET() {
  try {
    const state = await readChainState();
    return NextResponse.json(state, { headers: { "Cache-Control": CACHE_OK } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo estado on-chain" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

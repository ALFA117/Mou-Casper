import { NextResponse } from "next/server";
import { readChainState } from "@/lib/server/casper-read";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await readChainState();
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo estado on-chain" },
      { status: 500 }
    );
  }
}

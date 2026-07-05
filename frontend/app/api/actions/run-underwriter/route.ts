import { NextResponse } from "next/server";
import { runAgentScript } from "@/lib/server/run-script";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Dispara agents/underwriter-agent.mjs de verdad: x402 real -> Gemini real ->
 * register/stake/attest reales. Gasta CSPR real (ver ACTION_COST_ESTIMATES_CSPR).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const wallet = body.wallet === "underwriter_B" ? "underwriter_B" : "underwriter_A";
  const assetId = typeof body.assetId === "string" ? body.assetId : "invoice-batch-001";
  const stakeCspr = Number(body.stakeCspr) || 15;
  const profile = body.profile === "aggressive" ? "aggressive" : "conservative";

  const result = await runAgentScript("underwriter-agent.mjs", [
    wallet,
    assetId,
    String(stakeCspr),
    profile,
    "full",
  ]);

  return NextResponse.json(result, { status: result.exitCode === 0 ? 200 : 500 });
}

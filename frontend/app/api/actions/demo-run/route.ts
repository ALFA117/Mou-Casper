import { NextResponse } from "next/server";
import { runAgentScript } from "@/lib/server/run-script";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/**
 * Dispara agents/demo-run.mjs: el arco completo (2 underwriters + investor +
 * prueba de Constitution + cadena del servicer) en una sola invocacion real.
 * Tarda varios minutos y gasta ~180 CSPR reales (ver ACTION_COST_ESTIMATES_CSPR).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const assetId = typeof body.assetId === "string" ? body.assetId : "invoice-batch-003";
  const aStakeCspr = Number(body.aStakeCspr) || 15;
  const bStakeCspr = Number(body.bStakeCspr) || 20;
  const investorSeniorCspr = Number(body.investorSeniorCspr) || 15;
  const investorJuniorCspr = Number(body.investorJuniorCspr) || 10;
  const lossAmountCspr = Number(body.lossAmountCspr) || 30;

  const result = await runAgentScript("demo-run.mjs", [
    assetId,
    String(aStakeCspr),
    String(bStakeCspr),
    String(investorSeniorCspr),
    String(investorJuniorCspr),
    String(lossAmountCspr),
  ]);

  return NextResponse.json(result, { status: result.exitCode === 0 ? 200 : 500 });
}

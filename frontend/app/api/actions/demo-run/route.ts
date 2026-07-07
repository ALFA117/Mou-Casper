import { NextResponse } from "next/server";
import { runAgentScript } from "@/lib/server/run-script";
import { reserveActionSlot, releaseActionSlot } from "@/lib/server/demo-guard";

export const dynamic = "force-dynamic";
// Tope real del arco completo es ~10 min localmente, pero el plan Hobby de
// Vercel limita maxDuration a 300s -- no importa en la practica: esta ruta
// nunca ejecuta nada en Vercel (ver runAgentScript, corta con VERCEL === "1"
// antes de spawnear), asi que el valor solo necesita pasar la validacion del
// build.
export const maxDuration = 300;

/**
 * Dispara agents/demo-run.mjs: el arco completo (2 underwriters + investor +
 * prueba de Constitution + cadena del servicer) en una sola invocacion real.
 * Tarda varios minutos y gasta ~180 CSPR reales (ver ACTION_COST_ESTIMATES_CSPR).
 */
export async function POST(req: Request) {
  const guard = reserveActionSlot(req, "demo_run");
  if (!guard.ok) {
    return NextResponse.json(
      { exitCode: 1, stdout: "", stderr: guard.error, reason: guard.reason, retryAfterSeconds: guard.retryAfterSeconds, newLogEntries: [] },
      { status: guard.status ?? 429 }
    );
  }

  try {
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
  } finally {
    releaseActionSlot(req);
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { runAgentScript } from "@/lib/server/run-script";
import { reserveActionSlot, releaseActionSlot } from "@/lib/server/demo-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RUN_LOG_PATH = path.join(process.cwd(), "..", "agents", "run-log.json");

function readRunLog(): any[] {
  try {
    return JSON.parse(fs.readFileSync(RUN_LOG_PATH, "utf8"));
  } catch {
    return [];
  }
}

/**
 * Dispara agents/servicer-agent.mjs: mark_default -> slash -> penalize ->
 * reward, en una sola llamada. El bps de slash se deriva del ULTIMO quote
 * real de underwriter_B para este activo (leido de run-log.json, no
 * hardcodeado) vs el recommendedSpreadBps real del feed de riesgo de esa
 * misma corrida.
 */
export async function POST(req: Request) {
  const guard = reserveActionSlot(req, "mark_default");
  if (!guard.ok) {
    return NextResponse.json(
      { exitCode: 1, stdout: "", stderr: guard.error, newLogEntries: [] },
      { status: guard.status ?? 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const assetId = typeof body.assetId === "string" ? body.assetId : "invoice-batch-001";
    const lossAmountCspr = Number(body.lossAmountCspr) || 30;

    const log = readRunLog();
    const runsForAsset = log.filter((e: any) => e.type === "underwriter" && e.assetId === assetId);
    const aRun = [...runsForAsset].reverse().find((e: any) => e.walletName === "underwriter_A");
    const bRun = [...runsForAsset].reverse().find((e: any) => e.walletName === "underwriter_B");

    if (!aRun || !bRun) {
      return NextResponse.json(
        { error: `No hay corridas de underwriter_A y underwriter_B registradas para el activo "${assetId}". Corre ambos underwriters primero.` },
        { status: 400 }
      );
    }

    const marketRecommendedSpreadBps = bRun.riskData.recommendedSpreadBps;
    const bQuotedSpreadBps = bRun.quote.price_bps;
    const aStakeCspr = aRun.stakeAmountCspr;
    const bStakeCspr = bRun.stakeAmountCspr;

    const result = await runAgentScript("servicer-agent.mjs", [
      assetId,
      String(lossAmountCspr),
      String(marketRecommendedSpreadBps),
      String(bQuotedSpreadBps),
      String(aStakeCspr),
      String(bStakeCspr),
    ]);

    return NextResponse.json(
      { ...result, derivedFrom: { marketRecommendedSpreadBps, bQuotedSpreadBps, aStakeCspr, bStakeCspr } },
      { status: result.exitCode === 0 ? 200 : 500 }
    );
  } finally {
    releaseActionSlot(req);
  }
}

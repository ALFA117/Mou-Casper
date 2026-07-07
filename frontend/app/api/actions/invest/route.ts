import { NextResponse } from "next/server";
import { runAgentScript } from "@/lib/server/run-script";
import { reserveActionSlot, releaseActionSlot } from "@/lib/server/demo-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/** Dispara agents/investor-agent.mjs: buy_senior o buy_junior, real, payable. */
export async function POST(req: Request) {
  const guard = reserveActionSlot(req, "invest");
  if (!guard.ok) {
    return NextResponse.json(
      { exitCode: 1, stdout: "", stderr: guard.error, reason: guard.reason, retryAfterSeconds: guard.retryAfterSeconds, newLogEntries: [] },
      { status: guard.status ?? 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const entryPoint = body.entryPoint === "buy_junior" ? "buy_junior" : "buy_senior";
    const amountCspr = Number(body.amountCspr) || 15;

    const result = await runAgentScript("investor-agent.mjs", [entryPoint, String(amountCspr)]);

    return NextResponse.json(result, { status: result.exitCode === 0 ? 200 : 500 });
  } finally {
    releaseActionSlot(req);
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import { RUN_LOG_PATH } from "@/lib/server/agents-paths";

export const dynamic = "force-dynamic";

// Log real de corridas (agents/run-log.json) escrito por underwriter-agent.mjs /
// servicer-agent.mjs cada vez que una corrida real termina. No es mock: cada
// entrada corresponde a transacciones que de verdad se confirmaron en testnet.

export async function GET() {
  try {
    const raw = fs.readFileSync(RUN_LOG_PATH, "utf8");
    const log = JSON.parse(raw);
    return NextResponse.json({ log });
  } catch (err) {
    return NextResponse.json({ log: [] });
  }
}

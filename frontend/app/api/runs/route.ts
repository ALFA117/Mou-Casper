import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Log real de corridas (agents/run-log.json) escrito por underwriter-agent.mjs /
// servicer-agent.mjs cada vez que una corrida real termina. No es mock: cada
// entrada corresponde a transacciones que de verdad se confirmaron en testnet.
const RUN_LOG_PATH = path.join(process.cwd(), "..", "agents", "run-log.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(RUN_LOG_PATH, "utf8");
    const log = JSON.parse(raw);
    return NextResponse.json({ log });
  } catch (err) {
    return NextResponse.json({ log: [] });
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import { resolveRunLogPath } from "@/lib/server/agents-paths";

export const dynamic = "force-dynamic";

// Log real de corridas (agents/run-log.json) escrito por underwriter-agent.mjs /
// servicer-agent.mjs cada vez que una corrida real termina. No es mock: cada
// entrada corresponde a transacciones que de verdad se confirmaron en testnet.
// Si el archivo no esta, se responde 503 con la causa en lugar de un [] mudo.

export async function GET() {
  const file = resolveRunLogPath();
  if (!file) {
    return NextResponse.json({ log: [], error: "run-log.json no esta disponible en este servidor" }, { status: 503 });
  }
  try {
    const log = JSON.parse(fs.readFileSync(file, "utf8"));
    return NextResponse.json({ log: Array.isArray(log) ? log : [] });
  } catch (err) {
    return NextResponse.json(
      { log: [], error: err instanceof Error ? err.message : "No se pudo leer run-log.json" },
      { status: 500 }
    );
  }
}

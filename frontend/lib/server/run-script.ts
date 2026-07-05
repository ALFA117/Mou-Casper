import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const AGENTS_DIR = path.join(process.cwd(), "..", "agents");
const RUN_LOG_PATH = path.join(AGENTS_DIR, "run-log.json");

export interface ScriptRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  newLogEntries: unknown[];
}

function readRunLog(): unknown[] {
  try {
    return JSON.parse(fs.readFileSync(RUN_LOG_PATH, "utf8"));
  } catch {
    return [];
  }
}

/**
 * Corre uno de los scripts .mjs reales de /agents como un proceso hijo y
 * espera a que termine. Los botones del dashboard (Paso 11) usan esto para
 * disparar acciones que SI gastan CSPR real -- nada se simula aqui, es el
 * mismo codigo que se usa por CLI.
 */
export async function runAgentScript(scriptName: string, args: string[]): Promise<ScriptRunResult> {
  // Guardia de servidor, no solo de UI: aunque alguien salte el boton
  // deshabilitado (devtools, curl directo), Vercel no tiene /keys, no tiene el
  // facilitator x402 en localhost, y su filesystem de funciones es de solo
  // lectura -- el spawn fallaria de todos modos, pero fallamos rapido con un
  // mensaje claro en vez de un stacktrace confuso.
  if (process.env.VERCEL === "1") {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "Este deploy corre en Vercel (solo lectura) - las acciones que gastan CSPR solo funcionan corriendo el proyecto localmente.",
      newLogEntries: [],
    };
  }

  const logCountBefore = readRunLog().length;
  const scriptPath = path.join(AGENTS_DIR, scriptName);

  const { exitCode, stdout, stderr } = await new Promise<{ exitCode: number; stdout: string; stderr: string }>(
    (resolve) => {
      const child = spawn("node", [scriptPath, ...args], { cwd: AGENTS_DIR });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", d => (stdout += d.toString()));
      child.stderr.on("data", d => (stderr += d.toString()));
      child.on("close", code => resolve({ exitCode: code ?? 1, stdout, stderr }));
      child.on("error", err => {
        stderr += String(err);
        resolve({ exitCode: 1, stdout, stderr });
      });
    }
  );

  const logAfter = readRunLog();
  const newLogEntries = logAfter.slice(logCountBefore);

  return { exitCode, stdout, stderr, newLogEntries };
}

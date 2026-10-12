import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Resuelto relativo a ESTE archivo (no a process.cwd()), para que agents/
 * se encuentre sin importar desde que carpeta se lanzo `next dev`/`next
 * start` -- process.cwd() depende de como el proceso fue invocado (npm run
 * dev, un script maestro, pm2, etc.) y romperlo desconecta el dashboard de
 * run-log.json en silencio (stake/reputacion/eventos en 0).
 */
export const AGENTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "agents");
export const RUN_LOG_PATH = path.join(AGENTS_DIR, "run-log.json");

/**
 * Donde leer run-log.json. En local es RUN_LOG_PATH. En Vercel la funcion no
 * corre desde la carpeta del build: import.meta.url apunta a una ruta que ya
 * no existe y el archivo llega por outputFileTracingIncludes (next.config.ts)
 * junto a frontend/, o sea en process.cwd()/../agents. Antes la ruta caia al
 * catch y el feed de produccion salia vacio sin avisar.
 */
export function resolveRunLogPath(): string | null {
  const candidates = [
    RUN_LOG_PATH,
    path.join(process.cwd(), "..", "agents", "run-log.json"),
    path.join(process.cwd(), "agents", "run-log.json"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

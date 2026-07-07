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

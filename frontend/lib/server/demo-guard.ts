/**
 * In-memory guard for the public Cloudflare Tunnel demo. State lives only in
 * this Node process — fine, because a single `next dev`/`next start` instance
 * is exactly what both the operator (localhost) and tunnel visitors hit.
 *
 * Restrictions below only kick in for requests whose Host header isn't
 * localhost/127.0.0.1 — i.e. traffic arriving through the public tunnel.
 * The operator's own local use (dry runs, the recorded video) is never
 * throttled: this file must never make local development harder.
 */

const COOLDOWN_MS = 3 * 60 * 1000;
const HOURLY_CAP = 10;
const HOUR_MS = 60 * 60 * 1000;

let lockHeld = false;
let lastPublicActionAt = 0;
let publicActionTimestamps: number[] = [];

export function isPublicHost(req: Request): boolean {
  const host = req.headers.get("host") || "";
  return !/localhost|127\.0\.0\.1|\[::1\]/.test(host);
}

export interface GuardResult {
  ok: boolean;
  status?: number;
  error?: string;
  retryAfterSeconds?: number;
}

export function reserveActionSlot(req: Request, actionKey: string): GuardResult {
  const isPublic = isPublicHost(req);

  if (isPublic && actionKey === "demo_run") {
    return {
      ok: false,
      status: 403,
      error:
        "El demo:run completo (~180 CSPR, varios minutos) está deshabilitado en la demo pública. Usa las acciones individuales de abajo, o clona el repo y córrelo con tus propias llaves (ver 'Run it yourself').",
    };
  }

  if (lockHeld) {
    return {
      ok: false,
      status: 429,
      error: "Otra acción está en curso ahora mismo en esta demo. Espera unos segundos y reintenta.",
    };
  }

  if (isPublic) {
    const now = Date.now();
    const elapsedSinceLast = now - lastPublicActionAt;
    if (lastPublicActionAt !== 0 && elapsedSinceLast < COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((COOLDOWN_MS - elapsedSinceLast) / 1000);
      return {
        ok: false,
        status: 429,
        error: `Cooldown de la demo pública: espera ${retryAfterSeconds}s antes de otra acción.`,
        retryAfterSeconds,
      };
    }
    publicActionTimestamps = publicActionTimestamps.filter(t => now - t < HOUR_MS);
    if (publicActionTimestamps.length >= HOURLY_CAP) {
      return {
        ok: false,
        status: 429,
        error: `Tope de ${HOURLY_CAP} acciones/hora alcanzado en la demo pública. Vuelve a intentar más tarde, o corre el proyecto localmente con tus propias llaves.`,
      };
    }
  }

  lockHeld = true;
  return { ok: true };
}

export function releaseActionSlot(req: Request): void {
  lockHeld = false;
  if (isPublicHost(req)) {
    const now = Date.now();
    lastPublicActionAt = now;
    publicActionTimestamps.push(now);
  }
}

export interface PublicDemoStatus {
  isPublic: boolean;
  demoRunEnabled: boolean;
  cooldownRemainingSeconds: number;
  actionsUsedThisHour: number;
  actionsCapPerHour: number;
}

export function getPublicDemoStatus(req: Request): PublicDemoStatus {
  const isPublic = isPublicHost(req);
  const now = Date.now();
  const elapsedSinceLast = lastPublicActionAt === 0 ? Infinity : now - lastPublicActionAt;
  const cooldownRemainingSeconds =
    elapsedSinceLast >= COOLDOWN_MS ? 0 : Math.ceil((COOLDOWN_MS - elapsedSinceLast) / 1000);
  const actionsUsedThisHour = publicActionTimestamps.filter(t => now - t < HOUR_MS).length;

  return {
    isPublic,
    demoRunEnabled: !isPublic,
    cooldownRemainingSeconds,
    actionsUsedThisHour,
    actionsCapPerHour: HOURLY_CAP,
  };
}

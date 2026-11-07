import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(value: number, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(value);
}

export function formatCspr(value: number, decimals = 2): string {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} CSPR`;
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function truncateHash(hash: string, lead = 8, tail = 6): string {
  if (hash.length <= lead + tail) return hash;
  return `${hash.slice(0, lead)}…${hash.slice(-tail)}`;
}

export function explorerDeployUrl(hash: string): string {
  const base =
    process.env.NEXT_PUBLIC_CASPER_EXPLORER_URL ?? "https://testnet.cspr.live";
  return `${base}/deploy/${hash}`;
}

// Tiempo relativo en el idioma activo ("hace 3 meses" / "3 months ago"). Antes
// solo llegaba a horas y en ingles: las corridas de julio salian como "2511h ago".
export function timeAgo(timestamp: number, locale: string = "en"): string {
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSeconds, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeconds / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSeconds / (86400 * 30)), "month");
  return rtf.format(Math.round(diffSeconds / (86400 * 365)), "year");
}

// Fecha corta y explicita ("25 Jul 2026" / "25 jul 2026") para decir de que
// corrida sale cada dato, sin depender de la zona horaria del visitante.
export function formatDate(value: string | number, locale: string = "en"): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

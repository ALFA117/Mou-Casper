"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getWaitingMessageKey } from "@/lib/dashboard-config";
import { useI18n } from "@/lib/i18n/context";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Reemplaza el spinner generico de "cargando" por un estado de espera que se
 * siente intencional: cronometro real + mensaje que evoluciona por umbrales de
 * tiempo (no un progreso fabricado — los deploys reales tardan 2-10 min en
 * Casper Testnet, ver tareas.md).
 */
export function BusyStatusBar({ actionKey, startedAt }: { actionKey: string; startedAt: number }) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = now - startedAt;
  const message = t(getWaitingMessageKey(actionKey, Math.floor(elapsedMs / 1000)));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-glow backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Loader2 className="size-4 shrink-0 animate-spin text-senior-glow" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{message}</p>
          <span className="shrink-0 rounded-md bg-surface-3 px-2 py-1 font-mono text-xs tabular-nums text-foreground-muted">
            {formatElapsed(elapsedMs)}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden bg-surface-3">
          <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-senior-glow to-transparent bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
}

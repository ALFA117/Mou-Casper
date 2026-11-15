"use client";

import { ArrowRight } from "lucide-react";

/**
 * Hint sutil para el visitante que llega por el tunel publico y aterriza
 * frente a 5 botones sin saber cual tocar primero. Apunta al siguiente paso
 * no completado del arco (ver logica en app/dashboard-client.tsx). Desaparece
 * sola cuando ese paso ya se corrio -- no es un tutorial que haya que cerrar.
 */
export function GuideHint({ text, targetId }: { text: string; targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="group flex min-h-11 items-center gap-2.5 rounded border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-hard-sm transition-colors hover:bg-surface-2"
    >
      <span aria-hidden className="size-2 shrink-0 rounded-full bg-brand" />
      {text}
      <ArrowRight className="ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </a>
  );
}

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
      className="group flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-xs font-medium text-brand-glow shadow-glow-brand transition-colors hover:bg-brand/15"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-glow opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-brand-glow" />
      </span>
      {text}
      <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </a>
  );
}

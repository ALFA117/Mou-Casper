"use client";

import { useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TRANSITION_MS = 150;

/**
 * Explica un termino tecnico a un jurado no-experto sin ensuciar la UI.
 * Accesible por hover Y foco de teclado (no solo hover) — un juez tabulando
 * por la pagina tiene que poder llegar a esto igual que con el mouse.
 *
 * El globo SOLO existe en el DOM mientras esta visible o desvaneciendose —
 * montarlo siempre (aunque con opacity-0) hacia que su ancho fijo contara
 * para el scrollWidth de la pagina y rompia el layout en mobile (ver
 * auditoria de overflow), incluso con el tooltip cerrado.
 */
export function InfoTooltip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
  };
  const hide = () => {
    setEntered(false);
    hideTimer.current = setTimeout(() => setMounted(false), TRANSITION_MS);
  };

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-brand-glow focus-visible:text-brand-glow"
      >
        <Info className="size-3.5" aria-hidden />
        <span className="sr-only">{label}</span>
      </button>
      {mounted && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-border bg-surface-3 px-3 py-2 text-[11px] font-normal leading-snug text-foreground-muted shadow-glow transition-all ease-out",
            "motion-reduce:transition-none",
            entered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          )}
          style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        >
          {children}
        </span>
      )}
    </span>
  );
}

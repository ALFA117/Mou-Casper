"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Explica un termino tecnico a un jurado no-experto sin ensuciar la UI.
 * Accesible por hover Y foco de teclado (no solo hover) — un juez tabulando
 * por la pagina tiene que poder llegar a esto igual que con el mouse.
 */
export function InfoTooltip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-describedby={id}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-brand-glow focus-visible:text-brand-glow"
      >
        <Info className="size-3.5" aria-hidden />
        <span className="sr-only">{label}</span>
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-lg border border-border bg-surface-3 px-3 py-2 text-[11px] font-normal leading-snug text-foreground-muted shadow-glow transition-all duration-150 ease-out",
          "motion-reduce:transition-none",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
        )}
      >
        {children}
      </span>
    </span>
  );
}

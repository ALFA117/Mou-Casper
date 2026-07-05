"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { explorerDeployUrl, truncateHash, cn } from "@/lib/utils";

/**
 * Click en el hash trunco = copiar al portapapeles (confirmacion breve sin
 * layout shift: el texto flashea y la flecha se vuelve check por 1.2s).
 * Click en la flecha = abrir en CSPR.live, sin cambios de comportamiento.
 */
export function TxLink({
  hash,
  className,
  label,
}: {
  hash: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API no disponible (contexto no seguro, etc.) — el link de
      // abajo sigue funcionando como fallback, no hace falta avisar del error.
    }
  };

  return (
    <span className={cn("group inline-flex items-center gap-1 font-mono text-xs", className)}>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "Copiado al portapapeles" : `Copiar hash: ${hash}`}
        className={cn(
          "cursor-pointer underline decoration-dotted underline-offset-2 transition-colors duration-150",
          copied
            ? "text-brand-glow decoration-brand-glow"
            : "text-foreground-muted decoration-foreground-faint group-hover:text-senior-glow group-hover:decoration-senior-glow"
        )}
      >
        {label ?? truncateHash(hash)}
      </button>
      <a
        href={explorerDeployUrl(hash)}
        target="_blank"
        rel="noreferrer noopener"
        title={`Ver en CSPR.live: ${hash}`}
        className="text-foreground-faint transition-colors hover:text-senior-glow"
      >
        {copied ? (
          <Check className="size-3 shrink-0 text-brand-glow" aria-hidden />
        ) : (
          <ArrowUpRight
            className="size-3 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
            aria-hidden
          />
        )}
      </a>
    </span>
  );
}

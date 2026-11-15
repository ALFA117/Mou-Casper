"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { explorerDeployUrl, truncateHash, cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

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
  const { t } = useI18n();
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
    <span className={cn("group inline-flex items-center gap-1 font-mono text-[13px]", className)}>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? t("tx.copied") : t("tx.copyHash", { hash })}
        className={cn(
          "cursor-pointer py-1 underline decoration-border underline-offset-[3px] transition-colors duration-150",
          copied
            ? "text-senior-glow decoration-senior-glow"
            : "text-foreground-muted hover:text-foreground hover:decoration-foreground"
        )}
      >
        {label ?? truncateHash(hash)}
      </button>
      <a
        href={explorerDeployUrl(hash)}
        target="_blank"
        rel="noreferrer noopener"
        title={t("tx.openExplorer", { hash })}
        aria-label={t("tx.openExplorerShort", { hash: truncateHash(hash) })}
        className="-m-1 inline-flex p-1 text-foreground-faint transition-colors hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 shrink-0 text-senior-glow" aria-hidden />
        ) : (
          <ArrowUpRight
            className="size-3.5 shrink-0 transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px"
            aria-hidden
          />
        )}
      </a>
    </span>
  );
}

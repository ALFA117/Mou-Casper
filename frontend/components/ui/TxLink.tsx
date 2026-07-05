import { ArrowUpRight } from "lucide-react";
import { explorerDeployUrl, truncateHash } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TxLink({
  hash,
  className,
  label,
}: {
  hash: string;
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={explorerDeployUrl(hash)}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "group inline-flex items-center gap-1 font-mono text-xs text-foreground-muted transition-colors hover:text-senior-glow",
        className
      )}
      title={`View on CSPR.live: ${hash}`}
    >
      <span className="underline decoration-dotted decoration-foreground-faint underline-offset-2 group-hover:decoration-senior-glow">
        {label ?? truncateHash(hash)}
      </span>
      <ArrowUpRight className="size-3 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden />
    </a>
  );
}

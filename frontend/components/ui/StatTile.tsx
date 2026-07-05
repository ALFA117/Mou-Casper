import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "brand" | "danger";
  className?: string;
}) {
  const toneText =
    tone === "brand" ? "text-brand-glow" : tone === "danger" ? "text-danger-glow" : "text-foreground";
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-2/60 px-4 py-3", className)}>
      {Icon && (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-foreground-muted">
          <Icon className="size-4" aria-hidden />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-foreground-faint">{label}</div>
        <div className={cn("font-display text-lg font-semibold tabular-nums leading-tight", toneText)}>
          {value}
        </div>
        {sub && <div className="text-xs text-foreground-muted">{sub}</div>}
      </div>
    </div>
  );
}

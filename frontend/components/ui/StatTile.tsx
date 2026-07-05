import { cn } from "@/lib/utils";
import { CountUp } from "@/components/ui/CountUp";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  countUp,
  sub,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  countUp?: { value: number; decimals?: number; suffix?: string };
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
        <div className={cn("font-mono text-xl font-semibold tabular-nums leading-tight", toneText)}>
          {countUp ? (
            <CountUp value={countUp.value} decimals={countUp.decimals} suffix={countUp.suffix} />
          ) : (
            value
          )}
        </div>
        {sub && <div className="text-xs text-foreground-muted">{sub}</div>}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

type Tone = "brand" | "senior" | "junior" | "danger" | "carbon";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand",
  senior: "bg-senior",
  junior: "bg-brand",
  danger: "bg-brand",
  carbon: "bg-carbon",
};

export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
  className,
  trackClassName,
  label,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
  trackClassName?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-sm bg-surface-3", trackClassName)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-sm transition-[width] duration-700 ease-out", toneClasses[tone], className)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

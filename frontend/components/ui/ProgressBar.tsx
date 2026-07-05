import { cn } from "@/lib/utils";

type Tone = "brand" | "senior" | "junior" | "danger" | "carbon";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand",
  senior: "bg-senior",
  junior: "bg-junior",
  danger: "bg-danger",
  carbon: "bg-carbon",
};

export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
  className,
  trackClassName,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
  trackClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", trackClassName)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", toneClasses[tone], className)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

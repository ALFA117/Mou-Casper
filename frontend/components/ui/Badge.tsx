import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "neutral" | "brand" | "senior" | "junior" | "danger" | "warning" | "carbon";

const variantClasses: Record<Variant, string> = {
  neutral: "bg-surface-3 text-foreground-muted border-border",
  brand: "bg-brand/10 text-brand-glow border-brand/30",
  senior: "bg-senior/10 text-senior-glow border-senior/30",
  junior: "bg-junior/10 text-junior-glow border-junior/30",
  danger: "bg-danger/10 text-danger-glow border-danger/30",
  warning: "bg-junior/10 text-junior-glow border-junior/30",
  carbon: "bg-carbon/15 text-foreground-muted border-carbon/50",
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "neutral" | "brand" | "senior" | "junior" | "danger" | "warning" | "carbon";

const variantClasses: Record<Variant, string> = {
  neutral: "border-border bg-surface-2 text-foreground-muted",
  brand: "border-brand/30 bg-brand-dim text-brand-glow",
  senior: "border-senior/30 bg-senior-dim text-senior-glow",
  junior: "border-brand/30 bg-brand-dim text-brand-glow",
  danger: "border-brand/30 bg-brand-dim text-brand-glow",
  warning: "border-brand/30 bg-brand-dim text-brand-glow",
  carbon: "border-border bg-surface-3 text-foreground-muted",
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
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium tabular-nums",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

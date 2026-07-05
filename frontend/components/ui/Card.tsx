import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Accent = "none" | "senior" | "junior" | "brand" | "danger" | "carbon";

const accentRing: Record<Accent, string> = {
  none: "",
  senior: "hover:border-senior/40",
  junior: "hover:border-junior/40",
  brand: "hover:border-brand/40",
  danger: "hover:border-danger/40",
  carbon: "border-carbon/50",
};

export function Card({
  className,
  accent = "none",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { accent?: Accent }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface/80 backdrop-blur-sm shadow-glow transition-colors duration-200",
        accentRing[accent],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-3 p-5 pb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-display text-base font-semibold tracking-tight text-foreground", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pb-5", className)} {...props}>
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Accent = "none" | "senior" | "junior" | "brand" | "danger" | "carbon";

// El acento es una regla de 3 px en el borde superior: dice de qué lado del
// riesgo está el panel sin pintarlo entero.
const accentRule: Record<Accent, string> = {
  none: "",
  senior: "before:bg-senior",
  junior: "before:bg-brand",
  brand: "before:bg-brand",
  danger: "before:bg-brand",
  carbon: "before:bg-carbon",
};

export function Card({
  className,
  accent = "none",
  elevated = false,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { accent?: Accent; elevated?: boolean }) {
  return (
    <div
      className={cn(
        "panel",
        accent !== "none" &&
          "overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:content-['']",
        accentRule[accent],
        elevated && "shadow-hard",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-display text-lg font-semibold leading-tight text-foreground", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-5 sm:px-6", className)} {...props}>
      {children}
    </div>
  );
}

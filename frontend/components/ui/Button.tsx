import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

// primary = tinta (acción principal), danger = rojo (marcar default),
// secondary = borde, ghost = sin borde para la barra superior.
const variantClasses: Record<Variant, string> = {
  primary: "border border-border-strong bg-foreground text-background shadow-hard-sm enabled:hover:bg-foreground/90",
  secondary: "border border-border-strong/70 bg-surface text-foreground shadow-hard-sm enabled:hover:bg-surface-2",
  ghost: "border border-transparent bg-transparent text-foreground-muted enabled:hover:border-border enabled:hover:text-foreground",
  danger: "border border-brand bg-brand text-brand-ink shadow-hard-sm enabled:hover:bg-brand/90",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-11 px-3.5 text-sm gap-2",
  md: "min-h-11 px-4 text-sm gap-2",
  lg: "min-h-12 px-5 text-base gap-2",
};

const base =
  "inline-flex cursor-pointer select-none items-center justify-center rounded font-medium transition-[transform,box-shadow,background-color,color] duration-100 ease-out";
const press = "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

/** Mismas clases para un <a> que se ve como botón (anclas del hero). */
export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, press, variantClasses[variant].replace(/enabled:/g, ""), sizeClasses[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        "enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-none",
        variantClasses[variant],
        // Deshabilitado = neutro y legible: en la vitrina de solo lectura
        // todos los botones de acción están así y se tienen que leer.
        "disabled:cursor-not-allowed disabled:border-dashed disabled:border-border disabled:bg-surface-2 disabled:text-foreground-muted disabled:shadow-none",
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

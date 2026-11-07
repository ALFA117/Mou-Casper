import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-background hover:bg-brand-glow shadow-glow-brand",
  secondary: "bg-surface-3 text-foreground border border-border hover:border-foreground-faint",
  ghost: "bg-transparent text-foreground-muted hover:text-foreground hover:bg-surface-3",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-glow-danger",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

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
        "inline-flex cursor-pointer items-center justify-center rounded-xl font-medium tracking-tight transition-all duration-200 ease-out",
        // Deshabilitado = neutro y legible (antes: el color del boton al 40 %,
        // blanco sobre rojo tenue con contraste ~1.6). En la vitrina de solo
        // lectura TODOS los botones estan asi, asi que se tienen que leer.
        "disabled:cursor-not-allowed disabled:border disabled:border-border-subtle disabled:bg-surface-2 disabled:text-foreground-muted disabled:shadow-none",
        "enabled:hover:-translate-y-px active:scale-[0.98]",
        variantClasses[variant],
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

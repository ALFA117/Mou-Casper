import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Accent = "none" | "senior" | "junior" | "brand" | "danger" | "carbon";

// Las variantes con acento se elevan sutilmente al pasar el mouse (senten que
// "responden"); `carbon` (tarjeta ya castigada) se deja quieta a proposito —
// algo muerto no reacciona.
const accentRing: Record<Accent, string> = {
  none: "",
  senior: "hover:border-senior/40 hover:-translate-y-0.5 hover:shadow-glow-senior",
  junior: "hover:border-junior/40 hover:-translate-y-0.5 hover:shadow-glow-junior",
  brand: "hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-glow-brand",
  danger: "hover:border-danger/40 hover:-translate-y-0.5 hover:shadow-glow-danger",
  carbon: "border-carbon/50",
};

const hudCornerTone: Record<Accent, string> = {
  none: "border-border",
  senior: "border-senior/50",
  junior: "border-junior/50",
  brand: "border-brand/50",
  danger: "border-danger/50",
  carbon: "border-carbon/60",
};

/** Marcas de esquina estilo HUD/terminal — reservadas a las tarjetas "clave" (ver uso de `hud`). */
function HudCorners({ tone }: { tone: Accent }) {
  const cls = cn("absolute size-3 border-2", hudCornerTone[tone]);
  return (
    <>
      <span className={cn(cls, "left-2 top-2 border-b-0 border-r-0 rounded-tl-[3px]")} aria-hidden />
      <span className={cn(cls, "right-2 top-2 border-b-0 border-l-0 rounded-tr-[3px]")} aria-hidden />
      <span className={cn(cls, "bottom-2 left-2 border-t-0 border-r-0 rounded-bl-[3px]")} aria-hidden />
      <span className={cn(cls, "bottom-2 right-2 border-t-0 border-l-0 rounded-br-[3px]")} aria-hidden />
    </>
  );
}

export function Card({
  className,
  accent = "none",
  hud = false,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { accent?: Accent; hud?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border bg-gradient-to-b from-white/[0.04] via-surface-2/95 to-surface/90 backdrop-blur-sm shadow-glow transition-all duration-200 ease-out",
        accentRing[accent],
        className
      )}
      {...props}
    >
      {hud && <HudCorners tone={accent} />}
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
    <div className={cn("relative flex items-start justify-between gap-3 p-5 pb-3", className)} {...props}>
      {children}
      <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
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

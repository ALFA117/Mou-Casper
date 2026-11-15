import { cn } from "@/lib/utils";

/**
 * Entrada corta (opacidad + 6 px) escalonada por `index`. Es una animación
 * CSS, no un estado de React: el contenido nunca queda invisible si el JS
 * tarda o no corre, y prefers-reduced-motion la apaga desde globals.css.
 */
export function RevealOnMount({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("animate-rise", className)} style={{ animationDelay: `${index * 50}ms` }}>
      {children}
    </div>
  );
}

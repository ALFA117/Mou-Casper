import { cn } from "@/lib/utils";

/**
 * Marca de MOU CASPER: un hexagono wireframe partido en dos mitades — la
 * superior (cromo/blanco) representa el tramo senior, la inferior (rojo
 * Casper) el junior, con un nodo central que hace eco del hub de
 * AttestationRegistry en Background3D. Diseño original, no una copia del
 * logo de Casper — solo toma prestada la estetica de wireframe rojo neon.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("drop-shadow-[0_0_8px_rgba(255,31,31,0.55)]", className)}
      role="img"
      aria-label="MOU CASPER"
    >
      <g fill="none" stroke="#F4F4F5" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 19 L32 6 L54 19" />
        <path d="M10 19 L10 32" />
        <path d="M54 19 L54 32" />
        <path d="M32 32 L10 19" />
        <path d="M32 32 L32 6" />
        <path d="M32 32 L54 19" />
      </g>
      <g fill="none" stroke="#FF1F1F" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 45 L32 58 L54 45" />
        <path d="M10 32 L10 45" />
        <path d="M54 32 L54 45" />
        <path d="M32 32 L10 45" />
        <path d="M32 32 L32 58" />
        <path d="M32 32 L54 45" />
      </g>
      <g fill="#F4F4F5">
        <circle cx={32} cy={6} r={2.6} />
        <circle cx={10} cy={19} r={2.6} />
        <circle cx={54} cy={19} r={2.6} />
      </g>
      <g fill="#FF1F1F">
        <circle cx={10} cy={45} r={2.6} />
        <circle cx={54} cy={45} r={2.6} />
        <circle cx={32} cy={58} r={2.6} />
      </g>
      <circle cx={32} cy={32} r={3.4} fill="#FFFFFF" />
    </svg>
  );
}

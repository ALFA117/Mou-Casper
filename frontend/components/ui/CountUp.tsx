"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Anima el numero cuando `value` CAMBIA (nunca en el primer render, salvo
 * `startFromZero`) — comunica "este dato se acaba de mover", no decoracion.
 * Respeta prefers-reduced-motion saltando directo al valor final. Si `value`
 * cambia de nuevo a mitad de una animacion, retoma desde lo que ya se veia en
 * pantalla (no desde un punto de partida viejo) para no pegar saltos raros.
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 600,
  prefix = "",
  suffix = "",
  startFromZero = false,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  startFromZero?: boolean;
  className?: string;
}) {
  const initial = startFromZero ? 0 : value;
  const [display, setDisplay] = useState(initial);
  const [pulseKey, setPulseKey] = useState(0);
  const currentRef = useRef(initial);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = currentRef.current;
    const to = value;
    if (from === to) return;

    // Glow suave con currentColor cada vez que el numero se mueve — se re-dispara
    // cambiando la key de la animacion, no solo agregando la clase una vez.
    setPulseKey(k => k + 1);

    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      currentRef.current = to;
      setDisplay(to);
      return;
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const t = Math.min(1, elapsed / duration);
      const next = from + (to - from) * easeOutCubic(t);
      currentRef.current = next;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentRef.current = to;
        setDisplay(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span key={pulseKey} className={cn(className, pulseKey > 0 && "motion-safe:animate-glow-pulse")}>
      {prefix}
      {display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

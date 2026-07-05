"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sutil fade+rise al montar, escalonado por `index` — comunica "esto es un
 * producto terminado", no un efecto decorativo. Respeta prefers-reduced-motion
 * via el modificador motion-reduce de Tailwind (sin transform ni delay).
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
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className
      )}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {children}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { ReactNode } from "react";

type Tone = "senior" | "brand" | "junior" | "danger";

const railTone: Record<Tone, string> = {
  senior: "bg-senior/40",
  brand: "bg-brand/40",
  junior: "bg-junior/40",
  danger: "bg-danger/40",
};

const badgeTone: Record<Tone, string> = {
  senior: "border-senior/50 text-senior-glow",
  brand: "border-brand/50 text-brand-glow",
  junior: "border-junior/50 text-junior-glow",
  danger: "border-danger/50 text-danger-glow",
};

/**
 * Riel numerado que conecta visualmente el arco de la demo (activo -> underwriters
 * -> vault -> climax) para que el ojo siga un solo camino de arriba a abajo.
 * Solo visible en lg+: en mobile el orden vertical natural ya cumple el mismo rol.
 * El numero es tambien un ancla real (scroll suave) a su seccion — deja de ser
 * puramente decorativo, funciona como mini tabla de contenidos.
 */
export function DemoStep({
  n,
  tone,
  last,
  suggested,
  targetId,
  children,
}: {
  n: string;
  tone: Tone;
  last?: boolean;
  suggested?: boolean;
  targetId: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="relative lg:pl-10">
      {!last && (
        <div className={cn("absolute left-[15px] top-8 hidden w-px lg:block", railTone[tone])} style={{ bottom: "-1.5rem" }} />
      )}
      <a
        href={`#${targetId}`}
        aria-label={t("nav.goToSection", { n })}
        className={cn(
          "absolute left-0 top-0 hidden size-8 items-center justify-center rounded-full border bg-background font-mono text-[11px] font-semibold tabular-nums transition-transform duration-150 hover:scale-110 lg:flex",
          badgeTone[tone],
          suggested && "animate-pulse ring-2 ring-brand/60 ring-offset-2 ring-offset-background"
        )}
      >
        {n}
      </a>
      {children}
    </div>
  );
}

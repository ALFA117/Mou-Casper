"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { ReactNode } from "react";

type Tone = "senior" | "brand" | "junior" | "danger";

const badgeTone: Record<Tone, string> = {
  senior: "border-border-strong text-foreground",
  brand: "border-border-strong text-foreground",
  junior: "border-border-strong text-foreground",
  danger: "border-brand text-brand-glow",
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
    <div className="relative lg:pl-12">
      {!last && <div className="absolute left-[15px] top-8 hidden w-px bg-border lg:block" style={{ bottom: "-2.5rem" }} />}
      <a
        href={`#${targetId}`}
        aria-label={t("nav.goToSection", { n })}
        className={cn(
          "absolute left-0 top-0 hidden size-8 items-center justify-center rounded border bg-surface font-mono text-xs font-semibold tabular-nums transition-colors duration-150 hover:bg-surface-3 lg:flex",
          badgeTone[tone],
          suggested && "ring-2 ring-brand ring-offset-2 ring-offset-background"
        )}
      >
        {n}
      </a>
      {children}
    </div>
  );
}

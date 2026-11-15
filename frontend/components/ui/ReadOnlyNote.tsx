"use client";

import { Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

/**
 * Explica junto al botón por qué está deshabilitado en la vitrina de solo
 * lectura (antes solo lo decía un tooltip y el aviso del hero, a varias
 * pantallas de distancia).
 */
export function ReadOnlyNote({ show, className }: { show: boolean; className?: string }) {
  const { t } = useI18n();
  if (!show) return null;
  return (
    <p className={cn("flex gap-2 text-[13px] leading-snug text-foreground-muted", className)}>
      <Lock className="mt-0.5 size-3.5 shrink-0 text-foreground-faint" aria-hidden />
      {t("readOnly.inline")}
    </p>
  );
}

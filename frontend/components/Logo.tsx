import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Marca de MOU CASPER: logo oficial (public/logo.png), recortado en círculo
 * para ocultar las marcas de agua originales cerca de los bordes — ver
 * public/logo-source.png para el archivo sin procesar.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="MOU CASPER"
      width={96}
      height={96}
      priority
      className={cn("rounded-full border border-border bg-foreground", className)}
    />
  );
}

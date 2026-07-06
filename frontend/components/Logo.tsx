import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Marca de MOU CASPER: logo oficial (public/logo.png), recortado en circulo
 * para ocultar las marcas de agua originales cerca de los bordes — ver
 * public/logo-source.png para el archivo sin procesar.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="MOU CASPER"
      width={192}
      height={192}
      priority
      className={cn("rounded-full drop-shadow-[0_0_8px_rgba(255,31,31,0.55)]", className)}
    />
  );
}

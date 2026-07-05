import { DashboardClient } from "./dashboard-client";

// Server Component: decide aqui, en el servidor, si estamos en Vercel
// (process.env.VERCEL === "1", inyectado automaticamente por la plataforma
// en build y runtime) para poder deshabilitar los botones de accion en el
// cliente sin exponer la logica de deteccion ni variables server-only al
// bundle del navegador.
export default function Page() {
  const readOnly = process.env.VERCEL === "1";
  return <DashboardClient readOnly={readOnly} />;
}

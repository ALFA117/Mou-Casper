import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Sin esto, Next dev bloquea por seguridad los recursos /_next/* (JS de
  // hidratacion, HMR) cuando el Origin no es localhost -- eso deja la demo
  // publica servida vía tunel (Cloudflare/ngrok) congelada en el estado SSR
  // inicial (todo en 0) porque el JS que hace fetch de /api/chain/state
  // nunca llega a correr. Se usan wildcards para no tener que tocar este
  // archivo cada vez que se regenera un quick tunnel o se rota el dominio.
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app"],
};

export default nextConfig;

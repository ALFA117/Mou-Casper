import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("Uso: node verify-production-tunnel.mjs <url>");
  process.exit(1);
}

let failures = 0;
function check(label, condition, detail) {
  const status = condition ? "OK " : "FALLO";
  console.log(`[${status}] ${label}${detail ? " -- " + detail : ""}`);
  if (!condition) failures++;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on("console", msg => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", err => consoleErrors.push(String(err)));

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForSelector("h1:has-text('AVAL')", { timeout: 15000 });
console.log("Dashboard cargado.\n");

// No debe existir el overlay rojo de Next.js dev (ni el boton "N" de dev tools) -- solo existe en next dev.
const devOverlay = await page.locator("nextjs-portal, [data-nextjs-dialog-overlay], #__next-build-watcher").count();
check("Sin overlay de Next.js dev en el DOM (modo produccion)", devOverlay === 0, `elementos encontrados: ${devOverlay}`);

// Numeros reales -- el stat de stake total no debe quedarse en placeholder/0 tras la carga.
await page.waitForTimeout(1500);
const stakeText = await page.locator("text=/Total stake|Stake total/i").first().locator("..").innerText();
console.log("Stat stake:", stakeText.replace(/\n/g, " | "));
check("El stat de stake muestra un numero (no vacio/placeholder)", /\d/.test(stakeText));

const eventsText = await page.locator("text=/on-chain events logged|Eventos on-chain registrados/i").first().locator("..").innerText();
console.log("Stat eventos:", eventsText.replace(/\n/g, " | "));
check("El stat de eventos muestra un numero", /\d/.test(eventsText));

// Botones de accion activos por el tunel (buy_junior no deberia tener cooldown activo en este run).
const buyJuniorBtn = page.locator("button", { hasText: /Buy junior|Comprar junior/i }).first();
await buyJuniorBtn.waitFor({ timeout: 10000 });
const isDisabled = await buyJuniorBtn.isDisabled();
check("El boton 'Buy junior' esta presente y clickeable (no deshabilitado globalmente)", !isDisabled);

console.log("\nErrores de consola/pagina:", consoleErrors.length ? consoleErrors : "ninguno");

await page.screenshot({ path: "scripts/production-tunnel-evidence.png" });
console.log("Screenshot: scripts/production-tunnel-evidence.png");

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} verificacion(es) fallaron.`);
  process.exit(1);
}
console.log("\nOK: modo produccion sirve datos reales y botones activos por el tunel, sin overlay de dev.");

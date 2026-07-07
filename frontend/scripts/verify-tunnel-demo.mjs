import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("Uso: node scripts/verify-tunnel-demo.mjs <url-publica-del-tunel>");
  process.exit(1);
}

async function readOnChainEventsStat(page) {
  return page.evaluate(() => {
    const label = [...document.querySelectorAll("div")].find(
      d => d.children.length === 0 && /on-chain events logged/i.test(d.textContent.trim())
    );
    const card = label?.closest("div.rounded-xl");
    return card ? card.innerText.replace(/\s+/g, " ") : null;
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on("console", msg => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

console.log(`Cargando ${url} ...`);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForSelector("h1:has-text('AVAL')", { timeout: 15000 });
console.log("Dashboard cargado.");

const eventsBefore = await readOnChainEventsStat(page);
console.log("Stat de eventos (antes):", eventsBefore);

console.log("Llenando monto senior = 5 CSPR y haciendo click en el boton real...");
const seniorInput = page.getByLabel(/Senior amount|Monto senior/i).first();
await seniorInput.fill("5");

const buySeniorButton = page.locator("button", { hasText: /Buy senior|Comprar senior/i }).first();
await buySeniorButton.click();

console.log("Esperando a que el boton vuelva a estar disponible (accion terminada)...");
await page
  .waitForFunction(() => !document.querySelector("button.opacity-60, [aria-busy='true']"), { timeout: 60000 })
  .catch(() => {});
await page.waitForTimeout(2000);

console.log("Buscando toast de exito con hash clickeable...");
const toastLabel = page.locator("text=/Investor bought the senior tranche|Investor compró tramo senior/").first();
await toastLabel.waitFor({ timeout: 20000 });
const toastCard = toastLabel.locator("..");
const toastText = await toastCard.innerText();
console.log("Toast:", toastText.replace(/\n/g, " | "));

const txLink = toastCard.locator("a[href*='cspr.live/deploy/']").first();
const hasTxLink = await txLink.count();
const txHref = hasTxLink > 0 ? await txLink.getAttribute("href") : null;
console.log("Link a CSPR.live DENTRO del toast:", txHref ?? "NO ENCONTRADO");

console.log("Confirmando auto-refresh (sin click en Refresh) del contador de eventos en pantalla...");
const eventsAfter = await readOnChainEventsStat(page);
console.log("Stat de eventos (despues, sin recargar la pagina):", eventsAfter);

await page.screenshot({ path: "scripts/tunnel-demo-evidence.png", fullPage: false });
console.log("Screenshot guardado en scripts/tunnel-demo-evidence.png");

console.log("Errores de consola:", consoleErrors.length ? consoleErrors : "ninguno");

const ok = Boolean(txHref) && eventsAfter !== eventsBefore;
await browser.close();

if (!ok) {
  console.error("FALLO: falta el link de hash en el toast, o el contador no se auto-refrescó en pantalla.");
  process.exit(1);
}
console.log("OK: flujo publico verificado end-to-end (click real + toast con hash correcto + auto-refresh en UI).");

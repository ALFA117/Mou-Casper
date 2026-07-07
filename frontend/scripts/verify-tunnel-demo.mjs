import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("Uso: node scripts/verify-tunnel-demo.mjs <url-publica-del-tunel>");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", msg => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

console.log(`Cargando ${url} ...`);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForSelector("h1:has-text('AVAL')", { timeout: 15000 });
console.log("Dashboard cargado.");

const budgetBefore = await page
  .locator("text=/Presupuesto de demo restante|Demo budget remaining/")
  .first()
  .textContent()
  .catch(() => null);
console.log("Presupuesto visible antes:", budgetBefore);

console.log("Disparando buy_senior (5 CSPR) real...");
const res = await page.evaluate(async () => {
  const r = await fetch("/api/actions/invest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entryPoint: "buy_senior", amountCspr: 5 }),
  });
  return { status: r.status, body: await r.json() };
});
console.log("Resultado buy_senior:", JSON.stringify(res, null, 2));

if (res.status !== 200 || res.body.exitCode !== 0) {
  console.error("FALLO: la accion no se ejecuto correctamente.");
  await browser.close();
  process.exit(1);
}

console.log("Refrescando estado...");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const budgetAfter = await page
  .locator("text=/Presupuesto de demo restante|Demo budget remaining/")
  .first()
  .textContent()
  .catch(() => null);
console.log("Presupuesto visible despues:", budgetAfter);

console.log("Errores de consola:", consoleErrors.length ? consoleErrors : "ninguno");

await browser.close();
console.log("OK: flujo publico verificado end-to-end.");

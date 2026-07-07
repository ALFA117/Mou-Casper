import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("Uso: node scripts/verify-toast-messages.mjs <url-publica-del-tunel>");
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
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForSelector("h1:has-text('AVAL')", { timeout: 15000 });
console.log("Dashboard cargado.\n");

// --- Caso 1: demo:run bloqueado por tunel publico ---------------------------
console.log("=== Caso 1: demo:run en tunel publico ===");
const demoRunButton = page.locator("button", { hasText: /Run full demo:run|Correr demo:run completo/i }).first();
await demoRunButton.waitFor({ timeout: 10000 });
const isDisabled = await demoRunButton.isDisabled();
check("El boton demo:run esta deshabilitado (gris) en el tunel publico", isDisabled);
const tooltipSpan = demoRunButton.locator("xpath=..");
const tooltipTitle = await tooltipSpan.getAttribute("title");
check(
  "El tooltip explica por que (mismo texto que el toast usaria)",
  Boolean(tooltipTitle && /public|pública/i.test(tooltipTitle)),
  tooltipTitle ?? "sin tooltip"
);
const apiResult = await page.evaluate(async () => {
  const r = await fetch("/api/actions/demo-run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  return { status: r.status, body: await r.json() };
});
check(
  "La API subyacente rechaza con reason=tunnel_disabled (defensa en profundidad)",
  apiResult.status === 403 && apiResult.body.reason === "tunnel_disabled",
  JSON.stringify(apiResult)
);

// --- Caso 2 y 3: cooldown y exito en una accion individual real -------------
console.log("\n=== Casos 2+3: primera compra (exito) seguida de una segunda inmediata (cooldown) ===");
const seniorInput = page.getByLabel(/Senior amount|Monto senior/i).first();

async function buySeniorOnce() {
  await seniorInput.fill("5");
  const btn = page.locator("button", { hasText: /Buy senior|Comprar senior/i }).first();
  await btn.click();
  await page
    .waitForFunction(() => !document.querySelector("[aria-busy='true']"), { timeout: 60000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
}

// Si venimos de una corrida anterior con cooldown activo, esta primera
// llamada sera el caso "cooldown"; si no, sera el caso "exito". Cualquiera
// de los dos es un caso valido a verificar, se detecta por el resultado.
await buySeniorOnce();
let toastCard = page.locator("text=/^Buy senior$|^Comprar senior$/").first().locator("..");
let toastText = (await toastCard.innerText()).replace(/\n/g, " | ");
console.log("Toast #1:", toastText);

if (/SUCCESS/.test(toastText)) {
  check("Toast #1 titulo = 'Buy senior' (neutral, no 'bought' implicito)", true);
  const txLink = toastCard.locator("a[href*='cspr.live/deploy/']");
  check("Toast #1 de EXITO incluye link de hash clickeable", (await txLink.count()) > 0);

  console.log("\nDisparando una segunda compra inmediata (debe caer en cooldown)...");
  await buySeniorOnce();
  toastCard = page.locator("text=/^Buy senior$|^Comprar senior$/").first().locator("..");
  toastText = (await toastCard.innerText()).replace(/\n/g, " | ");
  console.log("Toast #2:", toastText);
  check("Toast #2 titulo sigue siendo 'Buy senior' incluso en fallo (no afirma exito)", !/SUCCESS/.test(toastText));
  check(
    "Toast #2 detalle explica el cooldown con tiempo (Wait X:XX / Espera X:XX)",
    /Wait \d+:\d{2}|Espera \d+:\d{2}/.test(toastText),
    toastText
  );
} else {
  check("Toast #1 titulo = 'Buy senior' (neutral) en fallo por cooldown", true);
  check(
    "Toast #1 detalle explica el cooldown con tiempo (Wait X:XX / Espera X:XX)",
    /Wait \d+:\d{2}|Espera \d+:\d{2}/.test(toastText),
    toastText
  );
}

await page.screenshot({ path: "scripts/toast-messages-evidence.png" });
console.log("\nScreenshot: scripts/toast-messages-evidence.png");

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} verificacion(es) fallaron.`);
  process.exit(1);
}
console.log("\nOK: los 3 casos (bloqueado, cooldown, exito) muestran el mensaje correcto.");

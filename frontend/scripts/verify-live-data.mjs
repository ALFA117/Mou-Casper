import { chromium } from "playwright";

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error("Uso: node scripts/verify-live-data.mjs <url1> [url2] ...");
  process.exit(1);
}

async function readStat(page, labelRegex) {
  return page.evaluate((pattern) => {
    const re = new RegExp(pattern, "i");
    const label = [...document.querySelectorAll("div")].find(
      d => d.children.length === 0 && re.test(d.textContent.trim())
    );
    const card = label?.closest("div.rounded-xl") || label?.parentElement;
    return card ? card.innerText.replace(/\s+/g, " ") : null;
  }, labelRegex.source);
}

let anyFailed = false;

for (const url of urls) {
  console.log(`\n=== ${url} ===`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleWarnings = [];
  page.on("console", msg => {
    if (msg.type() === "error" || msg.type() === "warning") consoleWarnings.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector("h1:has-text('AVAL')", { timeout: 15000 });

    // Los StatTile animan con countUp; dales tiempo a asentarse en el valor real.
    await page.waitForTimeout(2500);

    const stake = await readStat(page, /on-chain events logged|eventos on-chain registrados/i);
    const events = await readStat(page, /on-chain events logged|eventos on-chain registrados/i);
    const totalStakeCard = await readStat(page, /total stake|stake total/i);
    const reputationCard = await readStat(page, /avg\.? reputation|reputaci[oó]n promedio/i);
    const lastReadCard = await readStat(page, /last read|última lectura|ultima lectura/i);

    console.log("Total stake:", totalStakeCard);
    console.log("Avg reputation:", reputationCard);
    console.log("Events:", events);
    console.log("Last read:", lastReadCard);

    const screenshotPath = `scripts/live-data-${url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]/gi, "_")}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log("Screenshot:", screenshotPath);

    const eventsMatch = events?.match(/(\d+)\s*$/) || events?.match(/(\d+)/);
    const eventsCount = eventsMatch ? Number(eventsMatch[1]) : 0;
    const stakeHasNonZero = totalStakeCard && !/\b0(\.0+)?\s*CSPR/i.test(totalStakeCard.replace(/[\d.]+ CSPR/, m => m));
    const stakeNumberMatch = totalStakeCard?.match(/([\d.]+)\s*CSPR/);
    const stakeValue = stakeNumberMatch ? Number(stakeNumberMatch[1]) : 0;
    const lastReadIsReal = lastReadCard && !lastReadCard.includes("—");

    const ok = eventsCount > 0 && stakeValue > 0 && lastReadIsReal;

    console.log(ok ? "OK: datos reales (no ceros)." : "FALLO: se ven ceros / placeholders.");
    if (!ok) anyFailed = true;

    const relevantWarnings = consoleWarnings.filter(w => /blocked|cors|cross-origin|failed to fetch/i.test(w));
    if (relevantWarnings.length) {
      console.log("Warnings de consola relevantes:", relevantWarnings);
      anyFailed = true;
    }
  } catch (err) {
    console.error("ERROR cargando/verificando:", err.message);
    anyFailed = true;
  } finally {
    await browser.close();
  }
}

if (anyFailed) {
  console.error("\nFALLO en al menos una URL.");
  process.exit(1);
}
console.log("\nOK en todas las URLs.");

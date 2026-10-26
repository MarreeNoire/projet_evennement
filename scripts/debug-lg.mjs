/* Capture tablette + desktop pour vérifier overflow-x: clip sans régression. */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: "scripts/debug-tablet.png" });
const tabletScrollW = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: "scripts/debug-desktop.png" });
const desktopScrollW = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);

console.log(JSON.stringify({ tabletScrollW, desktopScrollW, errors }, null, 2));
await browser.close();

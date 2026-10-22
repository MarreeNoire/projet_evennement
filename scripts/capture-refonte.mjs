/* Captures de vérification responsive + screenshots manifest.
  Usage : node scripts/capture-refonte.mjs  (dev server sur :3000) */
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "scripts", "captures");
const MANIFEST_DIR = path.join(ROOT, "public", "manifest");
mkdirSync(OUT, { recursive: true });

const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

/* --- Vues de vérification responsive --- */
const shots = async (width, height, tag) => {
  await page.setViewportSize({ width, height });
  const router = [
    ["/", `${tag}-home`],
    ["/explorer", `${tag}-explorer`],
    ["/notifications", `${tag}-notifications`],
    ["/profil", `${tag}-profil-hide-not-open`],
  ];
  for (const [route, name] of router) {
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
    } catch (e) {
      errors.push(`navigation ${route} (${tag}): ${e.message}`);
    }
  }
};

await shots(390, 844, "390");
await shots(430, 932, "430");

/* Paysage mobile */
await page.setViewportSize({ width: 844, height: 390 });
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(OUT, "844x390-home.png") });

/* Tablette */
await shots(820, 1180, "820");

/* Desktop */
await shots(1440, 900, "1440");

/* --- Screenshots manifest (pages réelles, tailles de la fiche de marché) -- */
mkdirSync(MANIFEST_DIR, { recursive: true });
/* narrow : disposition mobile réelle, densité 2,5 → 1080×2340 px. */
const phone = await browser.newPage({
  viewport: { width: 432, height: 936 },
  deviceScaleFactor: 2.5,
});
await phone.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await phone.waitForTimeout(1200);
await phone.screenshot({ path: path.join(MANIFEST_DIR, "screenshot-narrow.png") });
await phone.close();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE + "/explorer", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(MANIFEST_DIR, "screenshot-wide.png") });

await browser.close();

statSync(path.join(MANIFEST_DIR, "screenshot-narrow.png"));
statSync(path.join(MANIFEST_DIR, "screenshot-wide.png"));
writeFileSync(path.join(OUT, "report.txt"), errors.join("\n") || "OK", "utf8");
console.log(errors.length ? `ERREURS:\n${errors.join("\n")}` : "OK");

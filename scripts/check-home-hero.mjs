/* Vérification visuelle et données réelles du hero d'accueil. */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.DEBUG_BASE ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "scripts", "captures");
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

async function inspect(label) {
  await page.waitForTimeout(700);
  const measures = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const section = document.querySelector("main section");
    const cards = Array.from(document.querySelectorAll("main section .grid > div"));
    return {
      viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
      title: document.title,
      h1: document.querySelector("h1")?.innerText ?? null,
      subtitle: document.querySelector("main section p")?.innerText ?? null,
      badge: document.querySelector("main section .rounded-full")?.innerText ?? null,
      hero: rect(section),
      nav: rect(document.querySelector("main section nav[aria-label='Navigation principale']")),
      navPill: rect(document.querySelector("main section .max-w-\\[760px\\]")),
      cards: cards.map((card) => ({ rect: rect(card), text: card.innerText })),
      dashboard: rect(document.querySelector("main section .max-w-\\[880px\\]")),
      main: rect(document.querySelector("main")),
      bodyPaddingBottom: getComputedStyle(document.body).paddingBlockEnd,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      ctas: Array.from(document.querySelectorAll("main a")).map((a) => ({
        text: a.innerText.trim(),
        href: a.getAttribute("href"),
      })),
    };
  });
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(measures, null, 2));
}

await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(OUT_DIR, "home-hero-desktop.png") });
await inspect("desktop 1440x900");

// Dropdown desktop réel.
const discoverButton = page.getByRole("button", { name: "Découvrir" });
if (await discoverButton.count()) {
  await discoverButton.click();
  await page.waitForTimeout(150);
  const menu = await page.getByRole("menu").innerText();
  console.log("\n=== desktop dropdown ===");
  console.log(menu);
  await page.screenshot({ path: path.join(OUT_DIR, "home-hero-desktop-dropdown.png") });
  await discoverButton.click();
}

await page.setViewportSize({ width: 768, height: 1024 });
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.screenshot({ path: path.join(OUT_DIR, "home-hero-tablet.png") });
await inspect("tablet 768x1024");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.screenshot({ path: path.join(OUT_DIR, "home-hero-mobile.png") });
await inspect("mobile 390x844");

const menuButton = page.getByRole("button", { name: "Ouvrir le menu" });
await menuButton.click();
await page.waitForTimeout(150);
const mobileMenu = await page.getByRole("navigation", { name: "Menu mobile" }).innerText();
const mobileMenuState = await page.evaluate(() => ({
  bodyPaddingBottom: getComputedStyle(document.body).paddingBlockEnd,
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth,
  menuRect: (() => {
    const el = document.querySelector("#event-hero-mobile-menu");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  })(),
}));
console.log("\n=== mobile menu ===");
console.log(JSON.stringify({ mobileMenu, mobileMenuState }, null, 2));
await page.screenshot({ path: path.join(OUT_DIR, "home-hero-mobile-menu.png") });

writeFileSync(path.join(OUT_DIR, "home-hero-errors.json"), JSON.stringify(errors, null, 2));
console.log("\n=== errors ===");
console.log(JSON.stringify(errors, null, 2));
await browser.close();

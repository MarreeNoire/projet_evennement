import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 720 } });
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1500);
const data = await page.evaluate(() => {
  const r = (el) => {
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
  };
  const section = document.querySelector("main section");
  const cards = Array.from(document.querySelectorAll("main section .grid > div"));
  return {
    h1: r(document.querySelector("h1")),
    hero: r(section),
    cards: cards.map((card) => ({ rect: r(card), text: card.innerText.slice(0, 80) })),
    overflow: document.documentElement.scrollWidth > innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
  };
});
console.log(JSON.stringify(data, null, 2));
await page.screenshot({ path: "scripts/captures/home-hero-320.png" });
await browser.close();

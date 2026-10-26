/* Debug mobile : capture 360×800 + mesures du DOM rendu. */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.DEBUG_BASE ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "scripts", "debug-mobile.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT });

const measures = await page.evaluate(() => {
  const q = (sel) => document.querySelector(sel);
  const info = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      position: cs.position,
      zIndex: cs.zIndex,
    };
  };
  const header = q("header.site-header");
  const rail = q("#app-side-rail");
  const stage = q('[data-hero-carousel="true"]');
  const main = q("main#contenu");
  const tabbar = q('.mobile-tabbar, [class*="tabbar"], [aria-label*="navigation"]');
  return {
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    htmlClass: document.documentElement.className,
    bodyPaddingInlineStart: getComputedStyle(document.body).paddingInlineStart,
    header: info(header),
    headerInnerWidth: header ? Math.round(header.querySelector("div")?.getBoundingClientRect().width ?? 0) : null,
    rail: rail ? info(rail) : null,
    heroStage: info(stage),
    main: info(main),
    scrollW: document.documentElement.scrollWidth,
    innerW: innerWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    tabbar: info(tabbar),
    buildId: self.__NEXT_DATA__?.buildId ?? null,
  };
});

writeFileSync(
  path.join(process.cwd(), "scripts", "debug-mobile.json"),
  JSON.stringify({ measures, errors }, null, 2),
  "utf8",
);
console.log(JSON.stringify({ measures, errors }, null, 2));
await browser.close();

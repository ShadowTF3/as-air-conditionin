import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("qa", { recursive: true });
const browser = await chromium.launch();
const results = [];
const errors = [];
const baseUrl = new URL(
  process.env.SITE_TEST_BASE_URL ?? "http://127.0.0.1:5173",
);
const siteUrl = (path) => new URL(path, baseUrl).href;
const routes = [
  "/",
  "/products",
  "/products/tadiran-alpha-140",
  "/products/electra-a-240",
  "/services",
  "/about",
  "/contact",
  "/faq",
  "/policies",
];
for (const lang of ["he", "ar", "en"]) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(
    (l) => localStorage.setItem("as-language", l),
    lang,
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push({ lang, error: e.message }));
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      !m.text().includes("Detected multiple renderers concurrently")
    )
      errors.push({ lang, error: m.text() });
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const route of width === 320 ? routes.slice(0, 5) : routes) {
      const response = await page.goto(siteUrl(route));
      await page.locator("body[data-ready=true]").waitFor();
      await page.locator(`html[lang="${lang}"]`).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        brokenImages: [...document.images]
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => i.src),
        overflow: [...document.querySelectorAll("main *,header *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              r.width > 0 &&
              (r.right > innerWidth + 2 || r.left < -2) &&
              getComputedStyle(el).position !== "absolute"
            );
          })
          .slice(0, 5)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent?.slice(0, 45),
          })),
      }));
      results.push({
        lang,
        width,
        route,
        status: response.status(),
        ...metrics,
      });
      if (
        width !== 320 &&
        [
          "/",
          "/products",
          "/products/tadiran-alpha-140",
          "/services",
          "/contact",
        ].includes(route)
      ) {
        const label =
          route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
        writeFileSync(
          `qa/${lang}-${width}-${label}.png`,
          await page.screenshot({ fullPage: true }),
          { flush: true },
        );
      }
    }
  }
  await context.close();
}
writeFileSync(
  "qa/report.json",
  JSON.stringify({ pages: results.length, results, errors }, null, 2),
  { flush: true },
);
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push({ interaction: true, error: e.message }));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("Detected multiple renderers concurrently"))
    errors.push({ interaction: true, error: m.text() });
});
await page.goto(siteUrl("/products"));
await page.locator("body[data-ready=true]").waitFor();
await expect(page.locator(".product-card")).toHaveCount(6);
await page.locator(".filters select").first().selectOption("Electra");
await expect(page.locator(".product-card")).toHaveCount(2);
await page.locator("input[type=search]").fill("no-such-model");
await expect(page.locator(".empty-state")).toBeVisible();
await page.locator(".empty-state button").click();
await expect(page.locator(".product-card")).toHaveCount(6);
await page.locator(".room-tabs button").nth(1).click();
await expect(page.locator(".product-card")).toHaveCount(2);
await page.locator(".room-tabs button").nth(0).click();
for (let i = 0; i < 4; i++)
  await page.locator(".compare-button").nth(i).click();
await expect(page.locator(".compare-button[aria-pressed=true]")).toHaveCount(3);
await page.locator(".compare-tray .button").click();
await expect(page.locator("dialog")).toBeVisible();
writeFileSync("qa/comparison.png", await page.screenshot(), { flush: true });
await page.keyboard.press("Escape");
await expect(page.locator("dialog")).not.toBeVisible();
await page.goto(siteUrl("/products/tadiran-alpha-140"));
await page.locator("[role=tab]").nth(1).click();
await expect(page.locator(".feature-grid")).toBeVisible();
await page.locator("[role=tab]").nth(2).click();
await expect(page.locator(".installation-info")).toBeVisible();
await page.goto(
  siteUrl("/contact?service=repair&product=electra-a-240"),
);
await expect(page.locator("select").nth(1)).toHaveValue("repair");
await expect(page.locator("select").nth(2)).toHaveValue("electra-a-240");
await page.locator("form input").nth(0).fill("בדיקת עיצוב");
await page.locator("form input").nth(1).fill("0520000000");
await page.locator("form input").nth(2).fill("תל אביב");
await page.locator("form textarea").fill("Visual QA only. No message is sent.");
await page.locator("button[type=submit]").click();
await expect(page.locator(".request-review")).toBeVisible();
const href = await page.locator(".request-review a").getAttribute("href");
const liveSettings = await (await page.request.get(siteUrl("/api/content"))).json();
expect(href).toContain(`https://wa.me/${liveSettings.settings.whatsappE164.replace(/\D/g, "")}?text=`);
expect(decodeURIComponent(href)).toContain("Electra A Inverter 240");
await page.setViewportSize({ width: 390, height: 844 });
await page.locator(".menu-button").click();
await expect(page.locator(".nav")).toBeVisible();
await page.locator(".nav a").nth(1).click();
await expect(page).toHaveURL(siteUrl("/products"));
await expect(page.locator(".nav")).not.toBeVisible();
await page.locator(".language").selectOption("en");
await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
await page.locator(".language").selectOption("ar");
await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
await page.goto(siteUrl("/faq"));
await page.locator(".faq-list summary").first().click();
await expect(page.locator("details[open]")).toHaveCount(1);
const failure = results.filter(
  (r) => r.status !== 200 || r.scroll > r.width + 2 || r.brokenImages.length,
);
writeFileSync(
  "qa/report.json",
  JSON.stringify(
    {
      pages: results.length,
      results,
      errors,
      failures: failure,
      interactions:
        "filters, empty state, room selection, comparison maximum and dialog, product tabs, contact request preparation, mobile navigation, language direction, FAQ",
    },
    null,
    2,
  ),
  { flush: true },
);
console.log(
  JSON.stringify(
    {
      pages: results.length,
      errors,
      failures: failure,
      interactions: "passed",
    },
    null,
    2,
  ),
);
await context.close();
await browser.close();
if (failure.length || errors.length) process.exitCode = 1;

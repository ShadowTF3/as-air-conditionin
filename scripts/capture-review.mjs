import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch();
for (const lang of ["he", "ar", "en"]) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(
    (l) => localStorage.setItem("as-language", l),
    lang,
  );
  const page = await context.newPage();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto("http://127.0.0.1:5173/");
    await page.locator("body[data-ready=true]").waitFor();
    await page.locator(`html[lang=${lang}]`).waitFor();
    await page.evaluate(() => document.fonts.ready);
    writeFileSync(`qa/fold-${lang}-${width}.png`, await page.screenshot(), {
      flush: true,
    });
  }
  if (lang === "he") {
    await page.goto("http://127.0.0.1:5173/products/tadiran-alpha-140");
    await page.locator("body[data-ready=true]").waitFor();
    writeFileSync("qa/fold-product.png", await page.screenshot(), {
      flush: true,
    });
    await page.locator(".gallery-options button").nth(1).click();
    writeFileSync("qa/fold-gallery.png", await page.screenshot(), {
      flush: true,
    });
  }
  await context.close();
}
await browser.close();
console.log("Review screenshots saved");

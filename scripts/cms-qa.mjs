import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const baseUrl = new URL(process.env.SITE_TEST_BASE_URL ?? "http://127.0.0.1:3000");
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!username || !password) throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD for the CMS QA run.");

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(new URL("/admin", baseUrl).href);
  await page.locator(".admin-language select").selectOption("en");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Open admin dashboard" }).click();
  await page.locator(".admin-stat-grid").waitFor();
  await page.locator(".admin-sidebar > button").nth(3).click();
  await page.locator(".cms-root").waitFor();

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 920 });
    for (const language of ["he", "ar", "en"]) {
      await page.locator(".admin-language select").selectOption(language);
      await page.waitForFunction((value) => document.documentElement.lang === value, language);
      const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(size.document <= size.viewport + 2, `CMS overflows at ${width}px in ${language}.`);
      assert.equal(await page.locator(".cms-tabs button").count(), 11, "All content modules should be available in each language.");
    }
  }

  await page.locator(".admin-language select").selectOption("en");
  await page.setViewportSize({ width: 1440, height: 1000 });
  mkdirSync("qa", { recursive: true });
  await page.screenshot({ path: "qa/admin-cms-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "qa/admin-cms-mobile.png", fullPage: false });
  await page.setViewportSize({ width: 1440, height: 1000 });

  const contentUrl = new URL("/api/admin/content", baseUrl).href;
  const original = await (await context.request.get(contentUrl)).json();
  await page.locator(".cms-tabs button").nth(2).click();
  const firstProduct = page.locator(".cms-list > .cms-entity").first();
  const initialPrice = original.products[0].price;
  await firstProduct.getByLabel("Price ₪", { exact: true }).fill(String(initialPrice + 7));
  await page.locator(".cms-sticky-save button").click();
  await page.locator(".admin-notice.success").waitFor();
  let saved = await (await context.request.get(contentUrl)).json();
  assert.equal(saved.products[0].price, initialPrice + 7, "CMS product price should persist.");
  await page.goto(new URL(`/products/${original.products[0].id}`, baseUrl).href);
  await page.waitForFunction((price) => document.querySelector(".detail-price strong")?.textContent?.replace(/\D/g, "") === String(price), initialPrice + 7);
  await page.goto(new URL("/admin", baseUrl).href);
  await page.locator(".admin-stat-grid").waitFor();
  await page.locator(".admin-sidebar > button").nth(3).click();
  await page.locator(".cms-root").waitFor();

  await page.locator(".cms-tabs button").nth(4).click();
  await page.locator(".cms-card .admin-panel-head .admin-primary-button").click();
  await page.locator(".cms-list > .cms-entity").last().waitFor();
  await page.locator(".cms-sticky-save button").click();
  await page.locator(".admin-notice.success").waitFor();
  saved = await (await context.request.get(contentUrl)).json();
  assert.equal(saved.offers.length, original.offers.length + 1, "A new multilingual offer should persist.");

  await page.locator(".cms-tabs button").nth(1).click();
  const copyEntry = page.locator(".cms-copy-item").first();
  const originalArabic = (await context.request.get(contentUrl)).ok() ? saved.copy[0].ar : "";
  const changedArabic = `${originalArabic} · CMS QA`;
  await copyEntry.locator(".cms-localized-grid .cms-field input").nth(1).fill(changedArabic);
  await page.locator(".cms-sticky-save button").click();
  await page.locator(".admin-notice.success").waitFor();
  saved = await (await context.request.get(contentUrl)).json();
  assert.equal(saved.copy[0].ar, changedArabic, "A visitor-facing translation should persist.");

  await page.locator(".cms-tabs button").nth(8).click();
  const newTitle = "CMS metadata QA title";
  await page.locator(".cms-card").nth(1).locator(".cms-localized-grid input").first().fill(newTitle);
  await page.locator(".cms-sticky-save button").click();
  await page.locator(".admin-notice.success").waitFor();
  await page.goto(new URL("/", baseUrl).href);
  await page.waitForFunction((title) => document.title.includes(title), newTitle);

  await page.goto(new URL("/admin", baseUrl).href);
  await page.locator(".admin-stat-grid").waitFor();
  await page.locator(".admin-sidebar > button").nth(3).click();
  await page.locator(".cms-tabs button").nth(10).click();
  const upload = page.waitForResponse((response) => response.url().includes("/api/admin/media") && response.request().method() === "POST");
  await page.locator(".cms-upload-large input[type=file]").setInputFiles("public/images/hero.webp");
  const uploadResponse = await upload;
  assert.equal(uploadResponse.status(), 200, "CMS media upload should succeed.");
  const uploaded = await uploadResponse.json();
  const mediaCard = page.locator(".cms-media-card").filter({ has: page.locator(`img[src="${uploaded.image}"]`) });
  await mediaCard.waitFor();
  page.on("dialog", (dialog) => dialog.accept());
  await mediaCard.locator("button.cms-delete").click();
  await mediaCard.waitFor({ state: "detached" });

  const usedUpload = page.waitForResponse((response) => response.url().includes("/api/admin/media") && response.request().method() === "POST");
  await page.locator(".cms-upload-large input[type=file]").setInputFiles("public/images/hero.webp");
  const usedUploadResponse = await usedUpload;
  assert.equal(usedUploadResponse.status(), 200, "A second CMS media upload should succeed.");
  const usedImage = (await usedUploadResponse.json()).image;
  await page.locator(".cms-tabs button").nth(2).click();
  await page.locator(".cms-gallery-add select").first().selectOption(usedImage);
  await page.locator(".cms-sticky-save button").click();
  await page.locator(".admin-notice.success").waitFor();
  saved = await (await context.request.get(contentUrl)).json();
  assert.ok(saved.products[0].gallery.includes(usedImage), "Product gallery edits should persist from the CMS.");
  await page.goto(new URL(`/products/${original.products[0].id}`, baseUrl).href);
  await page.waitForFunction(() => document.querySelectorAll(".gallery-options button").length >= 3);
  await page.locator(".gallery-options button").nth(1).click();
  await page.waitForFunction((image) => document.querySelector(".detail-visual > img")?.getAttribute("src") === image, usedImage);
  await page.goto(new URL("/admin", baseUrl).href);
  await page.locator(".admin-stat-grid").waitFor();
  await page.locator(".admin-sidebar > button").nth(3).click();
  await page.locator(".cms-tabs button").nth(10).click();
  await page.locator(".cms-tabs button").nth(7).click();
  await page.getByLabel("Company logo").selectOption(usedImage);
  await page.locator(".cms-sticky-save button").click();
  await page.locator(".admin-notice.success").waitFor();
  await page.locator(".cms-tabs button").nth(10).click();
  const usedMediaCard = page.locator(".cms-media-card").filter({ has: page.locator(`img[src="${usedImage}"]`) });
  await usedMediaCard.waitFor();
  assert.equal(await usedMediaCard.locator("button.cms-delete").isDisabled(), true, "The CMS should disable deletion for images used by saved content.");
  const guardedDelete = await context.request.delete(new URL("/api/admin/media", baseUrl).href, { data: { image: usedImage } });
  assert.equal(guardedDelete.status(), 409, "The media API should protect images referenced by saved content.");
  const publicContent = await (await context.request.get(new URL("/api/content", baseUrl).href)).json();
  assert.equal(publicContent.settings.logoImage, usedImage, "A selected CMS logo should appear in public site content.");
  assert.equal(publicContent.copy[0].source, undefined, "Public visitors should not receive CMS editor metadata.");
  assert.equal(publicContent.settings.phoneDisplay, saved.settings.phoneDisplay, "Public site content should match persisted admin data.");

  await page.locator(".admin-sidebar-bottom > button").click();
  await page.locator(".admin-auth-card").waitFor();
  const anonymous = await context.request.get(contentUrl);
  assert.equal(anonymous.status(), 401, "Admin content should remain protected after logout.");
  await context.close();
  console.log("CMS QA passed: multilingual layout, product price, offer, copy, SEO, media upload/deletion and protected session.");
} finally {
  await browser.close();
}

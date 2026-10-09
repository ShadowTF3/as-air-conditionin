import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { selectByValue } from "./select-helper.mjs";

const baseUrl = new URL(process.env.SITE_TEST_BASE_URL ?? "http://127.0.0.1:3000");
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!username || !password) throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD for the CMS QA run.");

async function saveCmsChanges(page, label) {
  const pending = page.waitForResponse((response) =>
    response.url().includes("/api/admin/content") && response.request().method() === "PUT",
  );
  await page.locator(".cms-sticky-save button").click();
  const response = await pending;
  const body = await response.text();
  assert.equal(response.status(), 200, `${label} failed to save: ${body}`);
  await page.locator(".admin-notice.success").waitFor();
  return JSON.parse(body);
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(new URL("/admin", baseUrl).href);
  await selectByValue(page, page.locator(".admin-language .select-field-trigger"), "en");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Open admin dashboard" }).click();
  await page.locator(".admin-stat-grid").waitFor();
  await page.locator(".admin-sidebar > button").nth(3).click();
  await page.locator(".cms-root").waitFor();

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 920 });
    for (const language of ["he", "ar", "en"]) {
      await selectByValue(page, page.locator(".admin-language .select-field-trigger"), language);
      await page.waitForFunction((value) => document.documentElement.lang === value, language);
      const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(size.document <= size.viewport + 2, `CMS overflows at ${width}px in ${language}.`);
      assert.equal(await page.locator(".cms-tabs button").count(), 11, "All content modules should be available in each language.");
    }
  }

  await selectByValue(page, page.locator(".admin-language .select-field-trigger"), "en");
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
  await firstProduct.locator("summary").click();
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
  await copyEntry.locator("summary").click();
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

  const getSavedContent = async () => (await context.request.get(contentUrl)).json();
  await page.locator(".cms-tabs button").nth(2).click();
  await page.locator(".cms-subtabs button").nth(0).click();
  let beforeAdds = await getSavedContent();
  await page.locator(".cms-card .admin-panel-head .admin-primary-button").first().click();
  let afterAdds = await saveCmsChanges(page, "Adding a CMS product");
  assert.equal(afterAdds.products.length, beforeAdds.products.length + 1, "CMS product addition should persist.");
  const newCmsProduct = afterAdds.products.at(-1);
  assert.ok(newCmsProduct.nameLocalized.he && newCmsProduct.nameLocalized.ar && newCmsProduct.nameLocalized.en, "New CMS products should include all three localized names.");

  const newProductCard = page.locator(".cms-list > .cms-entity").filter({ has: page.locator(`input[value="${newCmsProduct.id}"]`) });
  await newProductCard.waitFor();
  if (!(await newProductCard.evaluate((element) => element.open))) await newProductCard.locator("summary").click();
  const specRepeater = newProductCard.locator(".cms-entity-body .cms-repeater").nth(1);
  await specRepeater.locator(".cms-add-row").click();
  const specFields = specRepeater.locator(".cms-grid").last().locator("input");
  await specFields.nth(0).fill("QA specification HE");
  await specFields.nth(1).fill("QA specification AR");
  await specFields.nth(2).fill("QA specification EN");
  await specFields.nth(3).fill("QA specification value");
  const featureRepeater = newProductCard.locator(".cms-entity-body .cms-repeater").nth(2);
  await featureRepeater.locator(".cms-add-row").click();
  const featureFields = featureRepeater.locator(".cms-grid").last().locator("input");
  await featureFields.nth(0).fill("QA feature HE");
  await featureFields.nth(1).fill("QA feature AR");
  await featureFields.nth(2).fill("QA feature EN");
  afterAdds = await saveCmsChanges(page, "Adding product specification and feature rows");
  const savedCmsProduct = afterAdds.products.find((item) => item.id === newCmsProduct.id);
  assert.equal(savedCmsProduct.specs.length, 1, "A product specification row should persist.");
  assert.equal(savedCmsProduct.features.length, 1, "A product feature row should persist.");

  await page.locator(".cms-subtabs button").nth(1).click();
  beforeAdds = await getSavedContent();
  await page.locator(".cms-card .admin-panel-head .admin-primary-button").first().click();
  afterAdds = await saveCmsChanges(page, "Adding a category");
  assert.equal(afterAdds.categories.length, beforeAdds.categories.length + 1, "Category addition should persist.");

  await page.locator(".cms-subtabs button").nth(2).click();
  beforeAdds = await getSavedContent();
  await page.locator(".cms-card .admin-panel-head .admin-primary-button").first().click();
  afterAdds = await saveCmsChanges(page, "Adding a brand");
  assert.equal(afterAdds.brands.length, beforeAdds.brands.length + 1, "Brand addition should persist.");

  await page.locator(".cms-tabs button").nth(3).click();
  beforeAdds = await getSavedContent();
  await page.locator(".cms-card .admin-panel-head .admin-primary-button").first().click();
  afterAdds = await saveCmsChanges(page, "Adding a service");
  assert.equal(afterAdds.services.length, beforeAdds.services.length + 1, "Service addition should persist.");
  const addedService = afterAdds.services.at(-1);
  const addedServiceCard = page.locator(".cms-list > .cms-entity").filter({ has: page.locator(`input[value="${addedService.id}"]`) });
  if (!(await addedServiceCard.evaluate((element) => element.open))) await addedServiceCard.locator("summary").click();
  await addedServiceCard.locator(".cms-repeater .cms-add-row").click();
  afterAdds = await saveCmsChanges(page, "Adding a service detail");
  assert.equal(afterAdds.services.find((item) => item.id === addedService.id).points.length, 1, "A service detail should persist.");

  await page.locator(".cms-tabs button").nth(5).click();
  beforeAdds = await getSavedContent();
  await page.locator(".cms-card .admin-panel-head .admin-primary-button").first().click();
  afterAdds = await saveCmsChanges(page, "Adding an about value");
  assert.equal(afterAdds.about.values.length, beforeAdds.about.values.length + 1, "About value addition should persist.");

  await page.locator(".cms-tabs button").nth(6).click();
  beforeAdds = await getSavedContent();
  const faqAndPolicyAddButtons = page.locator(".cms-card .admin-panel-head .admin-primary-button");
  await faqAndPolicyAddButtons.nth(0).click();
  await faqAndPolicyAddButtons.nth(1).click();
  afterAdds = await saveCmsChanges(page, "Adding an FAQ and a policy");
  assert.equal(afterAdds.faqs.length, beforeAdds.faqs.length + 1, "FAQ addition should persist.");
  assert.equal(afterAdds.policies.items.length, beforeAdds.policies.items.length + 1, "Policy addition should persist.");

  await page.locator(".cms-tabs button").nth(7).click();
  beforeAdds = await getSavedContent();
  const linkAddButtons = page.locator(".cms-add-row");
  assert.equal(await linkAddButtons.count(), 3, "Navigation, footer and social link additions should all be available.");
  await linkAddButtons.nth(0).click();
  await linkAddButtons.nth(1).click();
  await linkAddButtons.nth(2).click();
  afterAdds = await saveCmsChanges(page, "Adding navigation, footer and social links");
  assert.equal(afterAdds.navigation.length, beforeAdds.navigation.length + 1, "Navigation link addition should persist.");
  assert.equal(afterAdds.footer.links.length, beforeAdds.footer.links.length + 1, "Footer link addition should persist.");
  assert.equal(afterAdds.settings.socialLinks.length, beforeAdds.settings.socialLinks.length + 1, "Social link addition should persist.");

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
  await page.locator(".cms-subtabs button").nth(0).click();
  const galleryProduct = page.locator(".cms-list > .cms-entity").filter({ has: page.locator(`input[value="${original.products[0].id}"]`) });
  if (!(await galleryProduct.evaluate((element) => element.open))) await galleryProduct.locator("summary").click();
  await selectByValue(page, page.locator(".cms-gallery-add .select-field-trigger").first(), usedImage);
  await page.locator(".cms-sticky-save button").click();
  await page.locator(".admin-notice.success").waitFor();
  saved = await (await context.request.get(contentUrl)).json();
  assert.ok(saved.products.find((product) => product.id === original.products[0].id).gallery.includes(usedImage), "Product gallery edits should persist from the CMS.");
  await page.goto(new URL(`/products/${original.products[0].id}`, baseUrl).href);
  const galleryChoice = page.locator(".gallery-options button").filter({ has: page.locator(`img[src="${usedImage}"]`) });
  await galleryChoice.waitFor();
  await galleryChoice.click();
  await page.waitForFunction((image) => document.querySelector(".detail-visual > img")?.getAttribute("src") === image, usedImage);
  await page.goto(new URL("/admin", baseUrl).href);
  await page.locator(".admin-stat-grid").waitFor();
  await page.locator(".admin-sidebar > button").nth(3).click();
  await page.locator(".cms-tabs button").nth(10).click();
  await page.locator(".cms-tabs button").nth(7).click();
  await selectByValue(page, page.getByLabel("Company logo"), usedImage);
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

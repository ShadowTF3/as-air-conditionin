import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { selectByValue } from "./select-helper.mjs";

const baseUrl = new URL(
  process.env.SITE_TEST_BASE_URL ?? "http://127.0.0.1:3000",
);
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!username || !password) {
  throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD for the admin QA run.");
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const unauthenticated = await context.request.get(new URL("/api/admin/content", baseUrl).href);
  assert.equal(unauthenticated.status(), 401, "Admin API must reject an anonymous visitor.");

  await page.goto(new URL("/admin", baseUrl).href);
  await selectByValue(page, page.locator(".admin-language .select-field-trigger"), "en");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Open admin dashboard" }).click();
  await page.locator(".admin-stat-grid").waitFor();

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["he", "ar", "en"]) {
      await selectByValue(page, page.locator(".admin-language .select-field-trigger"), language);
      await page.waitForFunction((value) => document.documentElement.lang === value, language);
      const layout = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        direction: document.documentElement.dir,
      }));
      assert.ok(layout.document <= layout.viewport + 2, `Admin layout overflows at ${width}px in ${language}.`);
      assert.equal(layout.direction, language === "en" ? "ltr" : "rtl", `Admin direction should match ${language}.`);
    }
  }
  await selectByValue(page, page.locator(".admin-language .select-field-trigger"), "he");
  await page.setViewportSize({ width: 1440, height: 1000 });
  mkdirSync("qa", { recursive: true });
  await page.screenshot({ path: "qa/admin-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "qa/admin-mobile.png", fullPage: false });
  await page.setViewportSize({ width: 1440, height: 1000 });

  const productsButton = page.locator(".admin-sidebar > button").nth(1);
  await productsButton.click();
  await page.locator(".admin-product-editor").waitFor();
  await selectByValue(page, page.locator(".admin-language .select-field-trigger"), "en");
  const contentUrl = new URL("/api/admin/content", baseUrl).href;
  const beforeProduct = await (await context.request.get(contentUrl)).json();
  const invalidContent = structuredClone(beforeProduct);
  invalidContent.products[0].nameLocalized.ar = "";
  const invalidResponse = await context.request.put(contentUrl, { data: invalidContent });
  assert.equal(invalidResponse.status(), 422, "Invalid content should be rejected with a validation error.");
  const invalidBody = await invalidResponse.json();
  assert.ok(invalidBody.issues.some((issue) => issue.path.join(".") === "products.0.nameLocalized.ar"), "A 422 response should identify the missing localized product name.");
  assert.deepEqual(await (await context.request.get(contentUrl)).json(), beforeProduct, "Rejected content must not be persisted.");
  const originalPrice = beforeProduct.products[0].price;
  await page.locator(".admin-product-editor .admin-form-grid input[type=number]").first().fill(String(originalPrice + 1));
  await page.getByRole("button", { name: "Save model" }).click();
  await page.locator(".admin-notice.success").waitFor();
  const afterProduct = await (await context.request.get(contentUrl)).json();
  assert.equal(afterProduct.products[0].price, originalPrice + 1, "Product price should persist.");

  await page.getByRole("button", { name: "Add a model" }).click();
  const editor = page.locator(".admin-product-editor");
  await editor.locator(".admin-form-grid input").nth(0).fill("QA Cooling");
  await editor.locator(".admin-form-grid input").nth(1).fill("QA Inverter 180");
  await editor.locator(".admin-form-grid input[type=number]").nth(0).fill("1490");
  await editor.locator(".admin-form-grid input[type=number]").nth(1).fill("9000");
  await editor.locator(".admin-form-grid input").nth(4).fill("A++");
  await selectByValue(page, editor.locator(".admin-form-grid .select-field-trigger"), "large");
  const createResponse = page.waitForResponse((response) =>
    response.url().includes("/api/admin/content") && response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save model" }).click();
  const created = await createResponse;
  assert.equal(created.status(), 200, `Creating a model failed: ${await created.text()}`);
  await page.locator(".admin-notice.success").waitFor();
  let afterCreate = await (await context.request.get(contentUrl)).json();
  const addedProduct = afterCreate.products.find((item) => item.name === "QA Inverter 180");
  assert.ok(addedProduct, "A new product should be added through the admin form.");
  assert.equal(addedProduct.nameLocalized.he, "QA Inverter 180", "Missing Hebrew model text should receive a fallback.");
  assert.equal(addedProduct.nameLocalized.ar, "QA Inverter 180", "Missing Arabic model text should receive a fallback.");
  assert.equal(addedProduct.nameLocalized.en, "QA Inverter 180", "The entered English model name should be preserved.");
  assert.equal(addedProduct.room, "large", "The selected room type should be saved.");

  page.on("dialog", (dialog) => dialog.accept());
  const deleteResponse = page.waitForResponse((response) =>
    response.url().includes("/api/admin/content") && response.request().method() === "PUT",
  );
  await editor.getByRole("button", { name: "Remove model" }).click();
  assert.equal((await deleteResponse).status(), 200, "Deleting a model should succeed.");
  await page.locator(".admin-notice.success").waitFor();
  afterCreate = await (await context.request.get(contentUrl)).json();
  assert.ok(!afterCreate.products.some((item) => item.id === addedProduct.id), "A deleted model should be removed from saved content.");

  await page.locator(".admin-sidebar > button").nth(2).click();
  await page.locator(".admin-business-form").waitFor();
  const beforeInvalidPhone = await (await context.request.get(contentUrl)).json();
  await page.getByLabel("Phone in international format").fill("+1");
  const invalidPhoneSave = page.waitForResponse((response) =>
    response.url().includes("/api/admin/content") && response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save business details" }).click();
  assert.equal((await invalidPhoneSave).status(), 422, "Invalid phone details should be rejected.");
  await page.locator(".admin-notice.error").waitFor();
  assert.match(await page.locator(".admin-notice.error").innerText(), /Phone in international format/, "The admin should identify the invalid phone field.");
  const afterInvalidPhone = await (await context.request.get(contentUrl)).json();
  assert.equal(afterInvalidPhone.settings.phoneE164, beforeInvalidPhone.settings.phoneE164, "Invalid phone details must not be persisted.");
  await page.getByLabel("Display phone number").fill("054-123-4567");
  await page.getByLabel("Phone in international format").fill("+972541234567");
  await page.getByLabel("WhatsApp in international format").fill("+972541234567");
  const imageUpload = page.waitForResponse((response) =>
    response.url().includes("/api/admin/media") && response.request().method() === "POST",
  );
  await page.locator(".admin-business-form input[type=file]").first().setInputFiles("public/images/hero.webp");
  assert.equal((await imageUpload).status(), 200, "Admin image upload should succeed.");
  await page.getByRole("button", { name: "Save business details" }).click();
  await page.locator(".admin-notice.success").waitFor();
  const afterSettings = await (await context.request.get(contentUrl)).json();
  assert.equal(afterSettings.settings.phoneDisplay, "054-123-4567", "Phone display should persist.");
  assert.equal(afterSettings.settings.whatsappE164, "+972541234567", "WhatsApp number should persist.");
  assert.match(afterSettings.settings.logoImage, /^\/api\/media\?file=/, "Uploaded logo should be stored as a managed image.");
  const managedImage = await context.request.get(new URL(afterSettings.settings.logoImage, baseUrl).href);
  assert.equal(managedImage.status(), 200, "Managed image should be served from persistent storage.");

  const publicContent = await (await context.request.get(new URL("/api/content", baseUrl).href)).json();
  assert.equal(publicContent.settings.phoneDisplay, "054-123-4567", "Saved phone should be public site content.");

  await page.locator(".admin-sidebar-bottom > button").click();
  await page.locator(".admin-auth-card").waitFor();
  const afterLogout = await context.request.get(contentUrl);
  assert.equal(afterLogout.status(), 401, "Admin API should reject the expired session after logout.");
  await context.close();
  console.log("Admin QA passed: protected login, validation diagnostics, product create/update/delete, phone/image updates and logout.");
} finally {
  await browser.close();
}

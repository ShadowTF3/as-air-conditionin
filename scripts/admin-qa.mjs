import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

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
  await page.getByLabel("שם משתמש").fill(username);
  await page.getByLabel("סיסמה").fill(password);
  await page.getByRole("button", { name: "כניסה ללוח הניהול" }).click();
  await page.locator(".admin-stat-grid").waitFor();

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["he", "ar", "en"]) {
      await page.locator(".admin-language select").selectOption(language);
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
  await page.locator(".admin-language select").selectOption("he");
  await page.setViewportSize({ width: 1440, height: 1000 });
  mkdirSync("qa", { recursive: true });
  await page.screenshot({ path: "qa/admin-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "qa/admin-mobile.png", fullPage: false });
  await page.setViewportSize({ width: 1440, height: 1000 });

  const productsButton = page.locator(".admin-sidebar > button").nth(1);
  await productsButton.click();
  await page.locator(".admin-product-editor").waitFor();
  const contentUrl = new URL("/api/admin/content", baseUrl).href;
  const beforeProduct = await (await context.request.get(contentUrl)).json();
  const originalPrice = beforeProduct.products[0].price;
  await page.locator(".admin-product-editor .admin-form-grid input[type=number]").first().fill(String(originalPrice + 1));
  await page.getByRole("button", { name: "שמירת הדגם" }).click();
  await page.locator(".admin-notice.success").waitFor();
  const afterProduct = await (await context.request.get(contentUrl)).json();
  assert.equal(afterProduct.products[0].price, originalPrice + 1, "Product price should persist.");

  await page.locator(".admin-sidebar > button").nth(2).click();
  await page.locator(".admin-business-form").waitFor();
  await page.getByLabel("מספר טלפון להצגה").fill("054-123-4567");
  await page.getByLabel("טלפון בפורמט בינלאומי").fill("+972541234567");
  await page.getByLabel("מספר WhatsApp בינלאומי").fill("+972541234567");
  const imageUpload = page.waitForResponse((response) =>
    response.url().includes("/api/admin/media") && response.request().method() === "POST",
  );
  await page.locator(".admin-business-form input[type=file]").first().setInputFiles("public/images/hero.webp");
  assert.equal((await imageUpload).status(), 200, "Admin image upload should succeed.");
  await page.getByRole("button", { name: "שמירת פרטי העסק" }).click();
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
  console.log("Admin QA passed: protected login, product price update, business phone update and logout.");
} finally {
  await browser.close();
}

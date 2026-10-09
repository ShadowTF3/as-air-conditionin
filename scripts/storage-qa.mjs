import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { request } from "@playwright/test";

const baseUrl = new URL(process.env.SITE_TEST_BASE_URL ?? "http://127.0.0.1:3000");
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!username || !password) throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD for storage QA.");

const client = await request.newContext();
const url = (pathname) => new URL(pathname, baseUrl).href;
const getContent = async () => {
  const response = await client.get(url("/api/admin/content"));
  assert.equal(response.status(), 200, "Admin content should be readable after login.");
  return response.json();
};
const putContent = async (content) => {
  const response = await client.put(url("/api/admin/content"), { data: content });
  assert.equal(response.status(), 200, `Content update failed: ${await response.text()}`);
};

try {
  const anonymous = await client.get(url("/api/admin/content"));
  assert.equal(anonymous.status(), 401, "Admin APIs must reject anonymous visitors.");

  const login = await client.post(url("/api/admin/login"), { data: { username, password } });
  assert.equal(login.status(), 200, "Admin login should succeed with configured credentials.");
  const original = await getContent();
  const changed = structuredClone(original);
  const suffix = Date.now().toString(36);
  const product = { ...structuredClone(changed.products[0]), id: `qa-product-${suffix}`, order: 9999 };
  const service = { ...structuredClone(changed.services[0]), id: `qa-service-${suffix}`, order: 9999 };
  const offer = {
    id: `qa-offer-${suffix}`,
    title: { he: "Storage QA", ar: "اختبار التخزين", en: "Storage QA" },
    description: { he: "בדיקת שמירה", ar: "التحقق من الحفظ", en: "Persistence check" },
    image: changed.products[0].image,
    buttonLabel: { he: "בדיקה", ar: "اختبار", en: "Test" },
    href: "/products",
    productId: product.id,
    oldPrice: product.price + 100,
    price: product.price,
    startsAt: "",
    endsAt: "",
    order: 9999,
    visible: true,
  };
  changed.products.push(product);
  changed.services.push(service);
  changed.offers.push(offer);
  changed.products[0].price += 1;
  changed.settings.phoneDisplay = "052-000-0001";
  changed.settings.phoneE164 = "+972520000001";
  changed.settings.whatsappE164 = "+972520000001";
  changed.copy[0].ar = `${changed.copy[0].ar} QA`;
  changed.home.showFaqPreview = !changed.home.showFaqPreview;

  let uploadedImage;
  try {
    await putContent(changed);
    let saved = await getContent();
    assert.ok(saved.products.some((item) => item.id === product.id), "Product creation should persist.");
    assert.equal(saved.products[0].price, changed.products[0].price, "Product price edits should persist.");
    assert.ok(saved.services.some((item) => item.id === service.id), "Service changes should persist.");
    assert.ok(saved.offers.some((item) => item.id === offer.id), "Offer creation should persist.");
    assert.equal(saved.settings.phoneE164, changed.settings.phoneE164, "Company phone settings should persist.");
    assert.equal(saved.copy[0].ar, changed.copy[0].ar, "Translations should persist.");
    assert.equal(saved.home.showFaqPreview, changed.home.showFaqPreview, "Page content should persist.");

    saved.products = saved.products.filter((item) => item.id !== product.id);
    saved.offers = saved.offers.filter((item) => item.id !== offer.id);
    saved.services = saved.services.filter((item) => item.id !== service.id);
    await putContent(saved);
    saved = await getContent();
    assert.ok(!saved.products.some((item) => item.id === product.id), "Product deletion should persist.");
    assert.ok(!saved.offers.some((item) => item.id === offer.id), "Offer deletion should persist.");
    assert.ok(!saved.services.some((item) => item.id === service.id), "Service deletion should persist.");

    const imageFile = await readFile(new URL("../public/images/hero.webp", import.meta.url));
    const upload = await client.post(url("/api/admin/media"), {
      multipart: { file: { name: "storage-qa.webp", mimeType: "image/webp", buffer: imageFile } },
    });
    assert.equal(upload.status(), 200, `Image upload failed: ${await upload.text()}`);
    uploadedImage = (await upload.json()).image;
    assert.match(uploadedImage, /^\/api\/media\?file=/, "Uploaded image URLs should remain compatible with saved content.");

    const imageResponse = await client.get(url(uploadedImage));
    assert.equal(imageResponse.status(), 200, "Uploaded image should be retrievable from managed storage.");
    assert.match(imageResponse.headers()["content-type"] ?? "", /^image\//, "Managed image should have an image content type.");

    saved.products[0].gallery = [...saved.products[0].gallery, uploadedImage];
    await putContent(saved);
    const assetsResponse = await client.get(url("/api/admin/media"));
    assert.equal(assetsResponse.status(), 200, "Admin media listing should be available.");
    const asset = (await assetsResponse.json()).find((item) => item.image === uploadedImage);
    assert.ok(asset?.used, "The media library should mark a gallery image as used.");

    const protectedDelete = await client.delete(url("/api/admin/media"), { data: { image: uploadedImage } });
    assert.equal(protectedDelete.status(), 409, "An image used in the gallery must not be deletable.");
    saved.products[0].gallery = saved.products[0].gallery.filter((item) => item !== uploadedImage);
    await putContent(saved);
    const deleteImage = await client.delete(url("/api/admin/media"), { data: { image: uploadedImage } });
    assert.equal(deleteImage.status(), 200, "An unused uploaded image should be deletable.");
    uploadedImage = undefined;

    console.log("Storage QA passed: product create/update/delete, price, service, offer, page content, translations, company settings, image upload/gallery/use guard/delete.");
  } finally {
    await putContent(original);
    if (uploadedImage) {
      await client.delete(url("/api/admin/media"), { data: { image: uploadedImage } }).catch(() => {});
    }
  }
} finally {
  await client.dispose();
}

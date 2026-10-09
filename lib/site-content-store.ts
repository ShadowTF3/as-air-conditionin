import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { defaultSiteContent, type LocalizedText, type ManagedBrand, type ManagedProduct, type SiteContent } from "../app/site-content-data";
import { copyEntryId } from "../app/copy-key";
import { siteContentSchema } from "./site-content-schema";
import { getSupabaseAdmin, getSupabaseMediaBucket } from "./supabase-server";

function dataDirectory() {
  return path.resolve(process.env.SITE_DATA_DIR || path.join(process.cwd(), "site-data"));
}

function contentFile() {
  return path.join(dataDirectory(), "site-content.json");
}

export function mediaDirectory() {
  return path.join(dataDirectory(), "media");
}

export function mediaFilenameIsSafe(filename: string) {
  return /^[a-f0-9-]{36}\.(?:jpg|png|webp|avif)$/.test(filename);
}

async function ensureDirectory() {
  await mkdir(mediaDirectory(), { recursive: true });
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function localized(value: unknown, fallback: LocalizedText): LocalizedText {
  const input = record(value);
  return {
    he: typeof input.he === "string" ? input.he : fallback.he,
    ar: typeof input.ar === "string" ? input.ar : fallback.ar,
    en: typeof input.en === "string" ? input.en : fallback.en,
  };
}

function slugFromName(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.length >= 2 ? slug.slice(0, 70) : `brand-${slug || "new"}`;
}

function migrateSiteContent(raw: unknown): SiteContent {
  const input = record(raw);
  const defaults = structuredClone(defaultSiteContent);
  const inputSettings = record(input.settings);
  const existingBrands = Array.isArray(input.brands) ? input.brands as ManagedBrand[] : defaults.brands;
  const brandList = existingBrands.map((brand) => ({
    ...brand,
    name: localized(record(brand).name, defaults.brands.find((item) => item.id === record(brand).id)?.name ?? { he: String(record(brand).name ?? ""), ar: String(record(brand).name ?? ""), en: String(record(brand).name ?? "") }),
  }));
  const productsInput = Array.isArray(input.products) ? input.products.map(record) : defaults.products;
  for (const product of productsInput) {
    const legacyBrand = typeof product.brand === "string" ? product.brand : "Brand";
    const brandId = typeof product.brandId === "string" ? product.brandId : slugFromName(legacyBrand);
    if (!brandList.some((brand) => brand.id === brandId)) {
      brandList.push({ id: brandId, name: { he: legacyBrand, ar: legacyBrand, en: legacyBrand }, logo: "", order: brandList.length + 1, visible: true });
    }
  }
  const categoryList = Array.isArray(input.categories) ? input.categories : defaults.categories;
  for (const product of productsInput) {
    const room = product.room === "living" || product.room === "large" ? product.room : "bedroom";
    if (!categoryList.some((item) => record(item).id === (typeof product.categoryId === "string" ? product.categoryId : room))) {
      const fallbackCategory = defaults.categories.find((item) => item.id === room)!;
      categoryList.push(fallbackCategory);
    }
  }
  const productsById = new Map(defaults.products.map((product) => [product.id, product]));
  const migratedProducts: ManagedProduct[] = productsInput.map((product, index) => {
    const id = typeof product.id === "string" ? product.id : `product-${index + 1}`;
    const base = productsById.get(id) ?? { ...defaults.products[0], id, brand: String(product.brand ?? "Brand"), name: String(product.name ?? "New model") };
    const brand = String(product.brand ?? base.brand);
    const room = product.room === "living" || product.room === "large" ? product.room : "bedroom";
    const categoryId = typeof product.categoryId === "string" ? product.categoryId : room;
    return {
      ...base,
      ...product,
      id,
      brand,
      name: String(product.name ?? base.name),
      nameLocalized: localized(product.nameLocalized, { he: String(product.name ?? base.name), ar: String(product.name ?? base.name), en: String(product.name ?? base.name) }),
      description: localized(product.description, base.description),
      warranty: localized(product.warranty, base.warranty),
      brandId: typeof product.brandId === "string" ? product.brandId : slugFromName(brand),
      categoryId,
      room,
      image: typeof product.image === "string" ? product.image : base.image,
      socialImage: typeof product.socialImage === "string" ? product.socialImage : (typeof product.image === "string" ? product.image : base.image),
      gallery: Array.isArray(product.gallery) ? product.gallery : [],
      specs: Array.isArray(product.specs) ? product.specs : base.specs,
      features: Array.isArray(product.features) ? product.features : base.features,
      available: typeof product.available === "boolean" ? product.available : true,
      visible: typeof product.visible === "boolean" ? product.visible : true,
      featured: typeof product.featured === "boolean" ? product.featured : index < 3,
      order: typeof product.order === "number" ? product.order : index + 1,
      seoTitle: localized(product.seoTitle, base.seoTitle),
      seoDescription: localized(product.seoDescription, base.seoDescription),
    } as ManagedProduct;
  });
  const copyInput = Array.isArray(input.copy) ? input.copy.map(record) : [];
  const normalizedCopyInput = copyInput.map((item) => {
    const id = String(item.id ?? "");
    if (id.startsWith("c-")) return { ...item, id };
    try {
      const legacyKey = JSON.parse(id) as [string, string, string | null];
      if (Array.isArray(legacyKey) && typeof legacyKey[0] === "string" && typeof legacyKey[1] === "string") {
        return { ...item, id: copyEntryId(legacyKey[0], legacyKey[1], typeof legacyKey[2] === "string" ? legacyKey[2] : undefined) };
      }
    } catch {
      // Ignore IDs that do not contain an older localized-copy key.
    }
    return item;
  });
  const copyOverrides = new Map(normalizedCopyInput.map((item) => [String(item.id), item]));
  const copy = defaults.copy.map((item) => {
    const saved = copyOverrides.get(item.id);
    if (!saved) return item;
    return { ...item, ...saved, id: item.id, group: item.group, source: item.source };
  });
  for (const item of normalizedCopyInput) {
    if (!copy.some((entry) => entry.id === item.id) && typeof item.id === "string") copy.push(item as unknown as SiteContent["copy"][number]);
  }
  const mergeObject = <T extends Record<string, unknown>>(base: T, saved: unknown): T => ({ ...base, ...record(saved) }) as T;
  const settings = { ...defaults.settings, ...inputSettings };
  settings.companyName = localized(inputSettings.companyName, defaults.settings.companyName);
  settings.brandDescriptor = localized(inputSettings.brandDescriptor, defaults.settings.brandDescriptor);
  settings.topbarMessage = localized(inputSettings.topbarMessage, defaults.settings.topbarMessage);
  settings.address = localized(inputSettings.address, defaults.settings.address);
  settings.businessHours = localized(inputSettings.businessHours, defaults.settings.businessHours);
  const seoInput = record(input.seo);
  const seoPagesInput = record(seoInput.pages);
  const seoPages = Object.fromEntries(Object.entries(defaults.seo.pages).map(([id, page]) => {
    const saved = record(seoPagesInput[id]);
    return [id, { ...page, ...saved, title: localized(saved.title, page.title), description: localized(saved.description, page.description) }];
  }));
  const migrated = {
    ...defaults,
    ...input,
    version: 2,
    copy,
    products: migratedProducts,
    brands: brandList,
    categories: categoryList,
    offers: Array.isArray(input.offers) ? input.offers : defaults.offers,
    services: Array.isArray(input.services) ? input.services : defaults.services,
    faqs: Array.isArray(input.faqs) ? input.faqs : defaults.faqs,
    policies: { ...defaults.policies, ...record(input.policies), notice: localized(record(input.policies).notice, defaults.policies.notice), items: Array.isArray(record(input.policies).items) ? record(input.policies).items : defaults.policies.items },
    settings,
    navigation: Array.isArray(input.navigation) ? input.navigation : defaults.navigation,
    footer: { ...defaults.footer, ...record(input.footer), links: Array.isArray(record(input.footer).links) ? record(input.footer).links : defaults.footer.links },
    home: mergeObject(defaults.home as unknown as Record<string, unknown>, input.home),
    about: mergeObject(defaults.about as unknown as Record<string, unknown>, input.about),
    servicePage: mergeObject(defaults.servicePage as unknown as Record<string, unknown>, input.servicePage),
    faqPage: mergeObject(defaults.faqPage as unknown as Record<string, unknown>, input.faqPage),
    seo: { ...defaults.seo, ...seoInput, defaultTitle: localized(seoInput.defaultTitle, defaults.seo.defaultTitle), defaultDescription: localized(seoInput.defaultDescription, defaults.seo.defaultDescription), pages: seoPages },
    theme: mergeObject(defaults.theme as unknown as Record<string, unknown>, input.theme),
  };
  return migrated as unknown as SiteContent;
}

export async function readSiteContent(): Promise<SiteContent> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("site_content")
      .select("content")
      .eq("id", "main")
      .maybeSingle();
    if (error) throw new Error(`Supabase site content read failed: ${error.message}`);
    if (!data) throw new Error("Supabase site content is empty; import the local site data before starting the app.");

    const normalized = migrateSiteContent(data.content);
    const parsed = siteContentSchema.safeParse(normalized);
    if (!parsed.success) throw new Error("Supabase site content failed validation; no defaults were substituted.");
    const saved = record(data.content);
    const savedCopy = record(saved).copy;
    const legacyCopyIds = Array.isArray(savedCopy) && savedCopy.some((item) => !String(record(item).id ?? "").startsWith("c-"));
    if (saved.version !== 2 || !Array.isArray(savedCopy) || legacyCopyIds) {
      await writeSiteContent(parsed.data);
    }
    return parsed.data;
  }

  await ensureDirectory();
  try {
    const raw = await readFile(contentFile(), "utf8");
    const saved = JSON.parse(raw) as unknown;
    const normalized = migrateSiteContent(saved);
    const parsed = siteContentSchema.safeParse(normalized);
    if (parsed.success) {
      const savedVersion = record(saved).version;
      const savedCopy = record(saved).copy;
      const legacyCopyIds = Array.isArray(savedCopy) && savedCopy.some((item) => !String(record(item).id ?? "").startsWith("c-"));
      if (savedVersion !== 2 || !Array.isArray(savedCopy) || legacyCopyIds) await writeSiteContent(parsed.data);
      return parsed.data;
    }
    console.error("[admin] Stored site content failed validation; using defaults.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[admin] Could not read stored site content; using defaults.");
    }
  }
  await writeSiteContent(defaultSiteContent);
  return defaultSiteContent;
}

export async function writeSiteContent(value: SiteContent): Promise<SiteContent> {
  const parsed = siteContentSchema.parse(value);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("site_content").upsert({
      id: "main",
      content: parsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (error) throw new Error(`Supabase site content write failed: ${error.message}`);
    return parsed;
  }

  await ensureDirectory();
  const filename = contentFile();
  const temporaryFile = `${filename}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(parsed, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryFile, filename);
  return parsed;
}

let writeLock = Promise.resolve();

export async function updateSiteContent(
  update: (current: SiteContent) => SiteContent,
): Promise<SiteContent> {
  const previous = writeLock;
  let release!: () => void;
  writeLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await writeSiteContent(update(await readSiteContent()));
  } finally {
    release();
  }
}

export async function saveUploadedImage(
  bytes: Uint8Array,
  extension: "jpg" | "png" | "webp" | "avif",
) {
  const filename = `${randomUUID()}.${extension}`;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.storage.from(getSupabaseMediaBucket()).upload(filename, bytes, {
      contentType: extension === "jpg" ? "image/jpeg" : `image/${extension}`,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Supabase image upload failed: ${error.message}`);
    return filename;
  }

  await ensureDirectory();
  await writeFile(path.join(mediaDirectory(), filename), bytes, {
    flag: "wx",
    mode: 0o644,
  });
  return filename;
}

export async function removeTemporaryImage(filename: string) {
  if (!mediaFilenameIsSafe(filename)) return;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.storage.from(getSupabaseMediaBucket()).remove([filename]);
    if (error) throw new Error(`Supabase image deletion failed: ${error.message}`);
    return;
  }
  await rm(path.join(mediaDirectory(), filename), { force: true });
}

export async function getPublicUploadedImageUrl(filename: string) {
  if (!mediaFilenameIsSafe(filename)) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = supabase.storage.from(getSupabaseMediaBucket()).getPublicUrl(filename);
  return data.publicUrl;
}

export async function readUploadedImage(filename: string) {
  if (!mediaFilenameIsSafe(filename)) return null;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.storage.from(getSupabaseMediaBucket()).download(filename);
    if (error) {
      if (error.message.toLowerCase().includes("not found") || error.message.includes("404")) return null;
      throw new Error(`Supabase image read failed: ${error.message}`);
    }
    return new Uint8Array(await data.arrayBuffer());
  }
  try {
    return new Uint8Array(await readFile(path.join(mediaDirectory(), filename)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function listSiteImages() {
  const publicImages = path.join(process.cwd(), "public", "images");
  const listFrom = async (directory: string, uploaded: boolean) => {
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      return entries.filter((entry) => entry.isFile() && /\.(?:jpe?g|png|webp|avif)$/i.test(entry.name)).map((entry) => ({
        image: uploaded ? `/api/media?file=${encodeURIComponent(entry.name)}` : `/images/${entry.name}`,
        name: entry.name,
        deletable: uploaded && mediaFilenameIsSafe(entry.name),
      }));
    } catch {
      return [];
    }
  };
  const supabase = getSupabaseAdmin();
  const staticImages = await listFrom(publicImages, false);
  let uploadedImages: Awaited<ReturnType<typeof listFrom>>;
  if (supabase) {
    uploadedImages = [];
    const bucket = supabase.storage.from(getSupabaseMediaBucket());
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await bucket.list("", {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`Supabase image listing failed: ${error.message}`);
      const files = (data ?? []).filter((item) => item.id && mediaFilenameIsSafe(item.name));
      uploadedImages.push(...files.map((item) => ({
        image: `/api/media?file=${encodeURIComponent(item.name)}`,
        name: item.name,
        deletable: true,
      })));
      if ((data?.length ?? 0) < 100) break;
    }
  } else {
    await ensureDirectory();
    uploadedImages = await listFrom(mediaDirectory(), true);
  }
  return [...staticImages, ...uploadedImages].sort((a, b) => a.name.localeCompare(b.name));
}

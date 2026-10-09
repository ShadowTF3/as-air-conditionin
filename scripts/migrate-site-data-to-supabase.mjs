import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL?.trim();
const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
if (!url || !key) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) before migration.");
}

const bucketName = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "site-media";
const dataDirectory = path.resolve(process.env.SITE_DATA_DIR || path.join(process.cwd(), "site-data"));
const contentPath = path.join(dataDirectory, "site-content.json");
const mediaPath = path.join(dataDirectory, "media");
const content = JSON.parse(await readFile(contentPath, "utf8"));
assert.ok(content && typeof content === "object" && Array.isArray(content.products), "The local site content file is not valid.");

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
});
let mediaFiles = [];
try {
  mediaFiles = (await readdir(mediaPath, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^[a-f0-9-]{36}\.(?:jpg|png|webp|avif)$/.test(entry.name))
    .map((entry) => entry.name);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const contentTypes = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };
for (const filename of mediaFiles) {
  const bytes = await readFile(path.join(mediaPath, filename));
  const extension = filename.slice(filename.lastIndexOf(".") + 1);
  const { error } = await supabase.storage.from(bucketName).upload(filename, bytes, {
    contentType: contentTypes[extension],
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) throw new Error(`Could not upload ${filename}: ${error.message}`);
}

const { error: writeError } = await supabase.from("site_content").upsert({
  id: "main",
  content,
  updated_at: new Date().toISOString(),
}, { onConflict: "id" });
if (writeError) throw new Error(`Could not migrate site content: ${writeError.message}`);

const { data: stored, error: readError } = await supabase
  .from("site_content")
  .select("content")
  .eq("id", "main")
  .single();
if (readError) throw new Error(`Could not verify migrated content: ${readError.message}`);
assert.equal(stored.content.products?.length, content.products.length, "The product count changed during migration.");
assert.equal(stored.content.settings?.phoneDisplay, content.settings?.phoneDisplay, "The company settings did not round-trip.");
assert.equal(stored.content.copy?.length, content.copy?.length, "The translations did not round-trip.");
const sortObjectKeys = (value) => Array.isArray(value)
  ? value.map(sortObjectKeys)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObjectKeys(value[key])]))
    : value;
assert.ok(isDeepStrictEqual(sortObjectKeys(stored.content), sortObjectKeys(content)), "Some content fields changed during migration.");

const names = new Set();
for (let offset = 0; ; offset += 1000) {
  const { data: storedMedia, error: mediaError } = await supabase.storage.from(bucketName).list("", { limit: 1000, offset });
  if (mediaError) throw new Error(`Could not verify migrated images: ${mediaError.message}`);
  for (const item of storedMedia ?? []) names.add(item.name);
  if ((storedMedia?.length ?? 0) < 1000) break;
}
for (const filename of mediaFiles) assert.ok(names.has(filename), `Migrated image is missing: ${filename}`);

console.log(`Supabase migration verified: ${content.products.length} products, ${mediaFiles.length} uploaded images, ${content.copy?.length ?? 0} localized copy entries.`);

import { adminConfigurationReady } from "@/lib/admin-auth";
import { readSiteContent } from "@/lib/site-content-store";
import { getSupabaseAdmin, getSupabaseMediaBucket } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkReadiness() {
  if (!adminConfigurationReady()) throw new Error("Admin configuration is missing.");
  const supabase = getSupabaseAdmin();
  await Promise.all([
    readSiteContent(),
    (async () => {
      if (!supabase) return;
      const bucketName = getSupabaseMediaBucket();
      const [bucket, images] = await Promise.all([
        supabase.storage.getBucket(bucketName),
        supabase.storage.from(bucketName).list("", { limit: 1 }),
      ]);
      if (bucket.error || !bucket.data?.public || images.error) {
        throw new Error("Public image storage is unavailable.");
      }
    })(),
  ]);
}

export async function GET() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      checkReadiness(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Readiness check timed out.")), 4_000);
      }),
    ]);
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

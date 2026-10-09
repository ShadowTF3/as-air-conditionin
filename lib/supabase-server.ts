import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getSupabaseAdmin() {
  const mode = process.env.SITE_STORAGE_MODE;
  if (mode && mode !== "local" && mode !== "supabase") {
    throw new Error("SITE_STORAGE_MODE must be either 'local' or 'supabase'.");
  }
  if (mode === "local") return null;

  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url && !key) {
    if (mode === "supabase" || (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build")) {
      throw new Error("Supabase storage is required here; configure SUPABASE_URL and a server-side secret key.");
    }
    return null;
  }
  if (!url || !key) {
    throw new Error("Configure SUPABASE_URL and a server-side Supabase secret key together.");
  }

  if (!client) {
    client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }
  return client;
}

export function getSupabaseMediaBucket() {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "site-media";
  if (!/^[a-z0-9][a-z0-9_-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new Error("SUPABASE_STORAGE_BUCKET contains an invalid bucket name.");
  }
  return bucket;
}

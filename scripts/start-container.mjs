// This launcher is copied next to the standalone server in the runtime image.
const problems = [];
for (const name of ["ADMIN_USERNAME", "ADMIN_PASSWORD", "SUPABASE_URL"]) {
  if (!process.env[name]?.trim()) problems.push(`${name} is required`);
}
if (!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim()) {
  problems.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is required");
}
if ((process.env.ADMIN_SESSION_SECRET?.length ?? 0) < 32) {
  problems.push("ADMIN_SESSION_SECRET must contain at least 32 characters");
}
if (process.env.SITE_STORAGE_MODE !== "supabase") {
  problems.push("SITE_STORAGE_MODE must be supabase for the production container");
}
if (process.env.SUPABASE_URL) {
  try {
    const url = new URL(process.env.SUPABASE_URL);
    if (url.protocol !== "https:" || url.username || url.password) {
      problems.push("SUPABASE_URL must be an HTTPS project URL");
    }
  } catch {
    problems.push("SUPABASE_URL must be a valid HTTPS project URL");
  }
}
const port = Number(process.env.PORT ?? 10000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  problems.push("PORT must be a valid TCP port");
}
if (problems.length) {
  console.error(`[startup] ${problems.join("; ")}. Set these values in Render Environment.`);
  process.exit(1);
}
process.env.HOST = "0.0.0.0";
process.env.NODE_ENV = "production";
await import(new URL("../server.js", import.meta.url).href);

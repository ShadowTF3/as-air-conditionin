import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const image = process.env.DOCKER_TEST_IMAGE || "as-air-conditioning:render";
const port = process.env.DOCKER_TEST_PORT || "14317";
const base = `http://127.0.0.1:${port}`;
const name = `as-air-qa-${Date.now()}`;
const username = "docker-qa-admin";
const password = "docker-qa-password-only";
const sessionSecret = "docker-qa-session-secret-at-least-32-characters";
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", timeout: 30_000 });
const waitUntil = async (pathname, expected) => {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(base + pathname, { signal: AbortSignal.timeout(4_500) });
      if (response.status === expected) return;
    } catch { /* Wait for the container's HTTP listener. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Container did not return ${expected} at ${pathname}.`);
};
const start = (...extra) => docker("run", "--detach", "--name", name,
  "--publish", `127.0.0.1:${port}:4329`,
  "--env", "PORT=4329", "--env", `ADMIN_USERNAME=${username}`,
  "--env", `ADMIN_PASSWORD=${password}`, "--env", `ADMIN_SESSION_SECRET=${sessionSecret}`,
  ...extra);

const missingConfiguration = spawnSync("docker", ["run", "--rm", image], { encoding: "utf8", timeout: 30_000 });
assert.equal(missingConfiguration.status, 1, "Production container should reject missing credentials.");
assert.match(missingConfiguration.stderr, /SUPABASE_SECRET_KEY/);
const localProduction = spawnSync("docker", ["run", "--rm", "--env", "SITE_STORAGE_MODE=local", image], { encoding: "utf8", timeout: 30_000 });
assert.equal(localProduction.status, 1, "Production startup should reject local storage.");
assert.match(localProduction.stderr, /SITE_STORAGE_MODE must be supabase/);

docker("run", "--rm", "--entrypoint", "node", image, "--input-type=module", "-e",
  "import assert from 'node:assert/strict'; import {existsSync} from 'node:fs'; assert.notEqual(process.getuid(),0); for (const p of ['.env.local','.env.production','site-data','.git','qa']) assert.equal(existsSync(p),false,p+' must not be included');");

try {
  // Bypass only the production launcher for isolated regression testing. Render
  // uses the default CMD, which requires Supabase and rejects this local mode.
  start("--env", "SITE_STORAGE_MODE=local", "--env", "SITE_DATA_DIR=/tmp/as-air-qa",
    "--entrypoint", "node", image, "server.js");
  await waitUntil("/api/health", 200);
  for (const route of ["/", "/products", "/products/tadiran-alpha-140", "/services", "/about", "/contact", "/admin", "/public-never-exists"]) {
    const response = await fetch(base + route);
    assert.equal(response.status, route === "/public-never-exists" ? 404 : 200, `Unexpected status at ${route}.`);
  }
  assert.equal((await fetch(base + "/api/admin/content")).status, 401);
  const storageQa = spawnSync(process.execPath, ["scripts/storage-qa.mjs"], {
    encoding: "utf8", timeout: 30_000,
    env: { ...process.env, SITE_TEST_BASE_URL: base, ADMIN_USERNAME: username, ADMIN_PASSWORD: password },
  });
  assert.equal(storageQa.status, 0, storageQa.stderr || storageQa.stdout);
  console.log(storageQa.stdout.trim());

  const login = await fetch(base + "/api/admin/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const getContent = async () => {
    const response = await fetch(base + "/api/admin/content", { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    return response.json();
  };
  const save = async (content) => {
    const response = await fetch(base + "/api/admin/content", {
      method: "PUT", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(content),
    });
    assert.equal(response.status, 200);
  };
  const original = await getContent();
  const modified = structuredClone(original);
  modified.products[0].price += 17;
  const form = new FormData();
  form.append("file", new Blob([await readFile(new URL("../public/images/hero.webp", import.meta.url))], { type: "image/webp" }), "qa.webp");
  const upload = await fetch(base + "/api/admin/media", { method: "POST", headers: { Cookie: cookie }, body: form });
  assert.equal(upload.status, 200);
  const mediaUrl = (await upload.json()).image;
  modified.products[0].gallery.push(mediaUrl);
  await save(modified);
  docker("restart", name);
  await waitUntil("/api/health", 200);
  const afterRestart = await getContent();
  assert.equal(afterRestart.products[0].price, modified.products[0].price);
  assert.ok(afterRestart.products[0].gallery.includes(mediaUrl));
  assert.equal((await fetch(base + mediaUrl)).status, 200);
  await save(original);
  docker("rm", "--force", name);

  start("--env", "SUPABASE_URL=https://qa-unavailable.invalid",
    "--env", "SUPABASE_SECRET_KEY=qa-key-not-a-real-secret", image);
  await waitUntil("/api/admin/session", 200);
  await waitUntil("/api/health", 503);
  assert.equal((await fetch(base + "/api/content")).status, 503);
  console.log("Docker QA passed: non-root Linux runtime, image isolation, dynamic PORT, pages/API/admin, CRUD and images, container restart, startup guards and unhealthy Supabase response. Local tests do not certify a live Supabase project.");
} finally {
  spawnSync("docker", ["rm", "--force", name], { encoding: "utf8", timeout: 30_000 });
}

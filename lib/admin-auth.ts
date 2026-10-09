import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "as_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;
const attempts = new Map<string, { count: number; startedAt: number }>();

export function adminConfigurationReady() {
  return Boolean(
    process.env.ADMIN_USERNAME?.trim() &&
      process.env.ADMIN_PASSWORD &&
      (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
  );
}

function sessionSignature(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Admin session secret is not configured.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function constantEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME?.trim() ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(
    expectedUsername &&
      expectedPassword &&
      constantEqual(username, expectedUsername) &&
      constantEqual(password, expectedPassword),
  );
}

export function loginRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.startedAt > 15 * 60_000) {
    attempts.set(key, { count: 0, startedAt: now });
    return false;
  }
  return current.count >= 8;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.startedAt > 15 * 60_000) {
    attempts.set(key, { count: 1, startedAt: now });
  } else {
    current.count += 1;
  }
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}

export function createSessionToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${sessionSignature(payload)}`;
}

export function sessionIsValid(token: string | undefined) {
  if (!token || token.length > 300) return false;
  const [expiresAtText, nonce, signature, ...extra] = token.split(".");
  if (!expiresAtText || !nonce || !signature || extra.length) return false;
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000) return false;
  try {
    return constantEqual(signature, sessionSignature(`${expiresAtText}.${nonce}`));
  } catch {
    return false;
  }
}

export function requestHasAdminSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1);
  return sessionIsValid(token);
}

export function sessionCookie(request: Request, token: string) {
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${requestIsSecure(request) ? "; Secure" : ""}`;
}

export function clearSessionCookie(request: Request) {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${requestIsSecure(request) ? "; Secure" : ""}`;
}

export function requestIsSecure(request: Request) {
  return (
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https"
  );
}

export function getClientKey(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

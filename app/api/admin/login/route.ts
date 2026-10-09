import {
  adminConfigurationReady,
  clearLoginFailures,
  createSessionToken,
  getClientKey,
  loginRateLimited,
  recordLoginFailure,
  requestIsSecure,
  sessionCookie,
  verifyCredentials,
} from "@/lib/admin-auth";
import { z } from "zod";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(300),
});

export async function POST(request: Request) {
  if (!adminConfigurationReady()) {
    return Response.json(
      { error: "Admin access has not been configured by the hosting administrator." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const hostname = new URL(request.url).hostname.replace(/^\[|\]$/g, "");
  const localRequest = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  if (!requestIsSecure(request) && !localRequest) {
    return Response.json(
      { error: "Enable HTTPS on the site before signing in to the admin panel." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const key = getClientKey(request);
  if (loginRateLimited(key)) {
    return Response.json(
      { error: "Too many attempts. Wait 15 minutes and try again." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid sign-in request." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success || !verifyCredentials(parsed.data.username, parsed.data.password)) {
    recordLoginFailure(key);
    return Response.json(
      { error: "The username or password is incorrect." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  clearLoginFailures(key);
  return Response.json(
    { authenticated: true },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Set-Cookie": sessionCookie(request, createSessionToken()),
      },
    },
  );
}

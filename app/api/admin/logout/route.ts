import { clearSessionCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return Response.json(
    { authenticated: false },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Set-Cookie": clearSessionCookie(request),
      },
    },
  );
}

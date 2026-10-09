import {
  adminConfigurationReady,
  requestHasAdminSession,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return Response.json(
    {
      configured: adminConfigurationReady(),
      authenticated: requestHasAdminSession(request),
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

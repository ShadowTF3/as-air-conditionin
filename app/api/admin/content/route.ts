import { requestHasAdminSession } from "@/lib/admin-auth";
import { siteContentSchema } from "@/lib/site-content-schema";
import { readSiteContent, writeSiteContent } from "@/lib/site-content-store";

export const runtime = "nodejs";

function unauthorized() {
  return Response.json({ error: "Please sign in again." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!requestHasAdminSession(request)) return unauthorized();
  return Response.json(await readSiteContent(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PUT(request: Request) {
  if (!requestHasAdminSession(request)) return unauthorized();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_000_000) {
    return Response.json({ error: "The update is too large." }, { status: 413 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid content update." }, { status: 400 });
  }
  const parsed = siteContentSchema.safeParse(input);
  if (!parsed.success) {
    return Response.json(
      { error: "Check the product details, contact information and image selections." },
      { status: 422 },
    );
  }
  if (new Set(parsed.data.products.map((product) => product.id)).size !== parsed.data.products.length) {
    return Response.json({ error: "Each product needs a unique model ID." }, { status: 422 });
  }
  try {
    return Response.json(await writeSiteContent(parsed.data), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return Response.json({ error: "Could not save changes to persistent storage." }, { status: 500 });
  }
}

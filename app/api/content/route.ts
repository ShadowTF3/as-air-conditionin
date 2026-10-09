import { readSiteContent } from "@/lib/site-content-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const content = await readSiteContent();
    const publicContent = {
      ...content,
      copy: content.copy.map(({ id, he, ar, en }) => ({ id, he, ar, en })),
    };
    return Response.json(publicContent, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return Response.json(
      { error: "Site content is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

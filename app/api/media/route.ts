import { getPublicUploadedImageUrl, mediaFilenameIsSafe, readUploadedImage } from "@/lib/site-content-store";

export const runtime = "nodejs";

const imageTypes = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
} as const;

export async function GET(request: Request) {
  const filename = new URL(request.url).searchParams.get("file") ?? "";
  if (!mediaFilenameIsSafe(filename)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const publicUrl = await getPublicUploadedImageUrl(filename);
    if (publicUrl) {
      return new Response(null, {
        status: 307,
        headers: {
          Location: publicUrl,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const bytes = await readUploadedImage(filename);
    if (!bytes) return new Response("Not found", { status: 404 });
    const extension = filename.slice(filename.lastIndexOf(".") + 1) as keyof typeof imageTypes;
    return new Response(bytes, {
      headers: {
        "Content-Type": imageTypes[extension],
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Image storage is temporarily unavailable.", { status: 503 });
  }
}

import { requestHasAdminSession } from "@/lib/admin-auth";
import { listSiteImages, mediaFilenameIsSafe, removeTemporaryImage, saveUploadedImage, readSiteContent } from "@/lib/site-content-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requestHasAdminSession(request)) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  const content = await readSiteContent();
  const serialized = JSON.stringify(content);
  const images = await listSiteImages();
  return Response.json(images.map((asset) => ({ ...asset, used: serialized.includes(asset.image) })), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function DELETE(request: Request) {
  if (!requestHasAdminSession(request)) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  let body: { image?: unknown };
  try {
    body = await request.json() as { image?: unknown };
  } catch {
    return Response.json({ error: "Choose a managed image." }, { status: 400 });
  }
  if (typeof body.image !== "string") {
    return Response.json({ error: "Choose a managed image." }, { status: 400 });
  }
  let filename = "";
  try {
    const image = new URL(body.image, "https://site.invalid");
    filename = image.searchParams.get("file") ?? "";
    if (image.pathname !== "/api/media" || !mediaFilenameIsSafe(filename)) throw new Error("invalid image");
  } catch {
    return Response.json({ error: "Only uploaded images can be deleted." }, { status: 400 });
  }
  const content = await readSiteContent();
  if (JSON.stringify(content).includes(body.image)) {
    return Response.json({ error: "This image is in use on the site." }, { status: 409 });
  }
  await removeTemporaryImage(filename);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

function imageExtension(bytes: Uint8Array): "jpg" | "png" | "webp" | "avif" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "webp";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" &&
    ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)))
  )
    return "avif";
  return null;
}

export async function POST(request: Request) {
  if (!requestHasAdminSession(request)) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 8_500_000) {
    return Response.json({ error: "Images must be smaller than 8 MB." }, { status: 413 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 8_000_000) {
    return Response.json({ error: "Choose an image smaller than 8 MB." }, { status: 413 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) {
    return Response.json(
      { error: "Use a valid JPEG, PNG, WebP or AVIF image." },
      { status: 415 },
    );
  }
  try {
    const filename = await saveUploadedImage(bytes, extension);
    return Response.json(
      { image: `/api/media?file=${encodeURIComponent(filename)}` },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "The host could not save this image." }, { status: 500 });
  }
}

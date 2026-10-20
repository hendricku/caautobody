import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { CMS_IMAGE_FORMATS, formatFromStagingPath } from "@/lib/cms/image-reference";
import { MAX_CMS_IMAGE_BYTES, optimiseCmsImage } from "@/lib/cms/image-optimization";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export const runtime = "nodejs";

const MAX_MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const admin = await getAdmin(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const permitted = await consumePublicRateLimit({ request, scope: "cms-media-upload", limit: 12, windowSeconds: 60, identity: admin.user.id, identityOnly: true });
    if (!permitted) return NextResponse.json({ error: "Too many image uploads. Please wait a minute and try again." }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "Image uploads are temporarily unavailable. Please try again." }, { status: 503 });
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_CMS_IMAGE_BYTES + MAX_MULTIPART_OVERHEAD_BYTES) return NextResponse.json({ error: "Choose a JPG, PNG, or WebP image no larger than 5 MB." }, { status: 400 });
  const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File) || file.size <= 0 || file.size > MAX_CMS_IMAGE_BYTES) return NextResponse.json({ error: "Choose a JPG, PNG, or WebP image no larger than 5 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = await optimiseCmsImage(bytes);
  if (!image) return NextResponse.json({ error: "Choose a valid JPG, PNG, or WebP image with dimensions up to 4096px." }, { status: 400 });
  const path = admin.user.id + "/" + randomUUID() + ".webp";
  const { error } = await admin.client.storage.from("cms-staging").upload(path, image.bytes, { contentType: CMS_IMAGE_FORMATS.webp.contentType, cacheControl: "0", upsert: false });
  if (error) { console.error("CMS media upload failure", { code: error.name }); return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 503 }); }
  return NextResponse.json({ image: `/api/admin/media?path=${encodeURIComponent(path)}` });
}
export async function GET(request: NextRequest) {
  const admin = await getAdmin(); if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const path = request.nextUrl.searchParams.get("path") || "";
  const format = formatFromStagingPath(path);
  if (!format) return new NextResponse("Invalid path", { status: 400 });
  const { data, error } = await admin.client.storage.from("cms-staging").download(path);
  if (error || !data) return new NextResponse("Media unavailable", { status: 404 });
  return new NextResponse(await data.arrayBuffer(), { headers: { "Content-Type": CMS_IMAGE_FORMATS[format].contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

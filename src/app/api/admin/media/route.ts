import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { CMS_IMAGE_FORMATS, type CmsImageFormat, formatFromStagingPath } from "@/lib/cms/image-reference";

// RIFF WebP has three dimension header variants. Reject malformed and oversized uploads.
function webpDimensions(buf: Buffer): [number,number] | null {
  if (buf.length < 30 || buf.toString("ascii",0,4) !== "RIFF" || buf.toString("ascii",8,12) !== "WEBP" || buf.readUInt32LE(4) + 8 > buf.length) return null;
  const format = buf.toString("ascii",12,16);
  if (format === "VP8X") return [1 + buf.readUIntLE(24,3),1 + buf.readUIntLE(27,3)];
  if (format === "VP8L" && buf[20] === 0x2f) return [1 + (buf[21] | (buf[22] & 0x3f) << 8),1 + ((buf[22] >> 6) | (buf[23] << 2) | (buf[24] & 0x0f) << 10)];
  if (format === "VP8 " && buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  return null;
}
function pngDimensions(buf: Buffer): [number, number] | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24 || !signature.every((byte, index) => buf[index] === byte) || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}
function jpegDimensions(buf: Buffer): [number, number] | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  for (let offset = 2; offset + 9 < buf.length;) {
    if (buf[offset] !== 0xff) return null;
    while (buf[offset] === 0xff) offset += 1;
    const marker = buf[offset];
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 >= buf.length) return null;
    const size = buf.readUInt16BE(offset + 1);
    if (size < 2 || offset + 1 + size > buf.length) return null;
    if (marker >= 0xc0 && marker <= 0xc3) return [buf.readUInt16BE(offset + 6), buf.readUInt16BE(offset + 4)];
    offset += size + 1;
  }
  return null;
}
function imageFormat(bytes: Buffer): { format: CmsImageFormat; dimensions: [number, number] } | null {
  const webp = webpDimensions(bytes);
  if (webp) return { format: "webp", dimensions: webp };
  const png = pngDimensions(bytes);
  if (png) return { format: "png", dimensions: png };
  const jpeg = jpegDimensions(bytes);
  if (jpeg) return { format: "jpeg", dimensions: jpeg };
  return null;
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const admin = await getAdmin(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File) || file.size <= 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Choose a JPG, PNG, or WebP image no larger than 5 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const inspected = imageFormat(bytes);
  if (!inspected || inspected.dimensions.some((n) => n < 1 || n > 4096)) return NextResponse.json({ error: "Choose a valid JPG, PNG, or WebP image with dimensions up to 4096px." }, { status: 400 });
  const spec = CMS_IMAGE_FORMATS[inspected.format];
  const path = admin.user.id + "/" + randomUUID() + "." + spec.extension;
  const { error } = await admin.client.storage.from("cms-staging").upload(path, bytes, { contentType: spec.contentType, cacheControl: "0", upsert: false });
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

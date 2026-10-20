import "server-only";
import sharp from "sharp";

export const MAX_CMS_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_CMS_INPUT_DIMENSION = 4096;
export const CMS_WEBP_MAX_DIMENSION = 2560;

const MAX_CMS_INPUT_PIXELS = MAX_CMS_INPUT_DIMENSION * MAX_CMS_INPUT_DIMENSION;
const HIGH_QUALITY_WEBP = 90;
const FALLBACK_WEBP_QUALITY = 84;

type CmsInputFormat = "jpeg" | "png" | "webp";

export type OptimisedCmsImage = {
  bytes: Buffer;
  width: number;
  height: number;
};

function webpDimensions(bytes: Buffer): [number, number] | null {
  if (bytes.length < 30 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP" || bytes.readUInt32LE(4) + 8 > bytes.length) return null;
  const format = bytes.toString("ascii", 12, 16);
  if (format === "VP8X") return [1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3)];
  if (format === "VP8L" && bytes[20] === 0x2f) return [1 + (bytes[21] | (bytes[22] & 0x3f) << 8), 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | (bytes[24] & 0x0f) << 10)];
  if (format === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  return null;
}

function pngDimensions(bytes: Buffer): [number, number] | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || !signature.every((byte, index) => bytes[index] === byte) || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function jpegDimensions(bytes: Buffer): [number, number] | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  for (let offset = 2; offset + 9 < bytes.length;) {
    if (bytes[offset] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 >= bytes.length) return null;
    const size = bytes.readUInt16BE(offset + 1);
    if (size < 2 || offset + 1 + size > bytes.length) return null;
    if (marker >= 0xc0 && marker <= 0xc3) return [bytes.readUInt16BE(offset + 6), bytes.readUInt16BE(offset + 4)];
    offset += size + 1;
  }
  return null;
}

function inspectImage(bytes: Buffer): { format: CmsInputFormat; dimensions: [number, number] } | null {
  const webp = webpDimensions(bytes);
  if (webp) return { format: "webp", dimensions: webp };
  const png = pngDimensions(bytes);
  if (png) return { format: "png", dimensions: png };
  const jpeg = jpegDimensions(bytes);
  if (jpeg) return { format: "jpeg", dimensions: jpeg };
  return null;
}

function hasSafeDimensions(dimensions: [number, number]) {
  return dimensions.every((dimension) => dimension >= 1 && dimension <= MAX_CMS_INPUT_DIMENSION);
}

async function encodeWebp(bytes: Buffer, quality: number) {
  return sharp(bytes, { limitInputPixels: MAX_CMS_INPUT_PIXELS, failOn: "error", sequentialRead: true })
    .rotate()
    .resize({ width: CMS_WEBP_MAX_DIMENSION, height: CMS_WEBP_MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 5, smartSubsample: true })
    .toBuffer();
}

/** Validates the real image bytes, then returns a metadata-free, oriented WebP. */
export async function optimiseCmsImage(bytes: Buffer): Promise<OptimisedCmsImage | null> {
  if (bytes.length === 0 || bytes.length > MAX_CMS_IMAGE_BYTES) return null;

  const inspected = inspectImage(bytes);
  if (!inspected || !hasSafeDimensions(inspected.dimensions)) return null;

  try {
    const metadata = await sharp(bytes, { limitInputPixels: MAX_CMS_INPUT_PIXELS, failOn: "error", sequentialRead: true }).metadata();
    if (!metadata.width || !metadata.height || metadata.format !== inspected.format || metadata.pages && metadata.pages > 1) return null;
    if (!hasSafeDimensions([metadata.width, metadata.height])) return null;

    let optimised = await encodeWebp(bytes, HIGH_QUALITY_WEBP);
    if (optimised.length > MAX_CMS_IMAGE_BYTES) optimised = await encodeWebp(bytes, FALLBACK_WEBP_QUALITY);
    if (optimised.length > MAX_CMS_IMAGE_BYTES) return null;

    const output = await sharp(optimised, { limitInputPixels: MAX_CMS_INPUT_PIXELS, failOn: "error" }).metadata();
    if (output.format !== "webp" || !output.width || !output.height) return null;
    return { bytes: optimised, width: output.width, height: output.height };
  } catch {
    return null;
  }
}

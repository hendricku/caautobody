import "server-only";
import sharp from "sharp";

/** Hard resource limits protect the upload worker; these are not display limits. */
export const MAX_CMS_IMAGE_BYTES = 32 * 1024 * 1024;
export const MAX_CMS_INPUT_PIXELS = 100_000_000;
export const MAX_CMS_IMAGE_OUTPUT_BYTES = 4 * 1024 * 1024;
/** Uploads processed in the browser are kept below common serverless request limits. */
export const MAX_CMS_TRANSFER_BYTES = 4 * 1024 * 1024;

export const CMS_IMAGE_PROFILES = {
  hero: { maxEdge: 2560, quality: 84 },
  featured: { maxEdge: 2100, quality: 83 },
  content: { maxEdge: 1920, quality: 82 },
  gallery: { maxEdge: 2200, quality: 83 },
  logo: { maxEdge: 1400, quality: 88 },
} as const;
export type CmsImagePurpose = keyof typeof CMS_IMAGE_PROFILES;

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif"]);
export type OptimisedCmsImage = { bytes: Buffer; width: number; height: number; originalBytes: number };

/** All CMS uploads are normalized by Sharp, even if the browser sent a WebP. */
export async function optimiseCmsImage(bytes: Buffer, purpose: CmsImagePurpose = "content"): Promise<OptimisedCmsImage | null> {
  if (!bytes.length || bytes.length > MAX_CMS_IMAGE_BYTES) return null;
  const profile = CMS_IMAGE_PROFILES[purpose];
  if (!profile) return null;
  try {
    const input = sharp(bytes, { limitInputPixels: MAX_CMS_INPUT_PIXELS, failOn: "error", sequentialRead: true });
    const metadata = await input.metadata();
    if (!metadata.width || !metadata.height || !ACCEPTED_FORMATS.has(metadata.format || "") || (metadata.pages || 1) > 1) return null;
    if (metadata.width * metadata.height > MAX_CMS_INPUT_PIXELS) return null;
    // No destructive crop: the public site's existing object-fit rules decide framing.
    // .rotate() applies EXIF orientation and strips EXIF/private metadata from output.
    let encoded: Buffer | null = null;
    for (const quality of [profile.quality, 76, 68, 58, 48]) {
      encoded = await sharp(bytes, { limitInputPixels: MAX_CMS_INPUT_PIXELS, failOn: "error", sequentialRead: true })
        .rotate()
        .resize({ width: profile.maxEdge, height: profile.maxEdge, fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 4, smartSubsample: true })
        .toBuffer();
      if (encoded.length <= MAX_CMS_IMAGE_OUTPUT_BYTES) break;
    }
    if (!encoded || encoded.length > MAX_CMS_IMAGE_OUTPUT_BYTES) return null;
    const result = await sharp(encoded, { limitInputPixels: MAX_CMS_INPUT_PIXELS }).metadata();
    if (result.format !== "webp" || !result.width || !result.height) return null;
    return { bytes: encoded, width: result.width, height: result.height, originalBytes: bytes.length };
  } catch {
    // Unsupported HEIC decoder, corrupted input, or resource guard failure.
    return null;
  }
}

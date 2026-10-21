/** Browser-side first pass avoids sending a 20 MB photo through a serverless API. */
export type CmsImagePurpose = "hero" | "featured" | "content" | "gallery" | "logo";
export const MAX_ORIGINAL_BYTES = 32 * 1024 * 1024;
const MAX_TRANSFER_BYTES = 3.5 * 1024 * 1024;
const MAX_PIXELS = 100_000_000;
const maxEdge: Record<CmsImagePurpose, number> = { hero: 2560, featured: 2100, content: 1920, gallery: 2200, logo: 1400 };
const accepted = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"]);

export function readableImageSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export async function prepareCmsUpload(file: File, purpose: CmsImagePurpose): Promise<Blob> {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  const allowedExtension = ["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"].includes(extension || "");
  if (!accepted.has(file.type) && !allowedExtension) throw new Error("Choose a JPG, PNG, WebP, AVIF, or browser-supported HEIC photo.");
  if (!file.size || file.size > MAX_ORIGINAL_BYTES) throw new Error("This photo is too large to process safely (32 MB limit). Please export a smaller copy.");
  const sourceUrl = URL.createObjectURL(file);
  let photo: HTMLImageElement | undefined;
  try {
    photo = new Image();
    photo.decoding = "async";
    photo.src = sourceUrl;
    await photo.decode();
    if (!photo.naturalWidth || !photo.naturalHeight || photo.naturalWidth * photo.naturalHeight > MAX_PIXELS) {
      throw new Error("This image exceeds the safe 100-megapixel processing limit.");
    }
    const scale = Math.min(1, maxEdge[purpose] / Math.max(photo.naturalWidth, photo.naturalHeight));
    let width = Math.max(1, Math.round(photo.naturalWidth * scale));
    let height = Math.max(1, Math.round(photo.naturalHeight * scale));
    // Lower the resolution only if quality adjustment alone cannot meet the
    // payload budget. No crop and no upscaling of smaller images.
    for (const shrink of [1, .82, .65]) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * shrink));
      canvas.height = Math.max(1, Math.round(height * shrink));
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("Image processing is unavailable in this browser.");
      context.drawImage(photo, 0, 0, canvas.width, canvas.height);
      for (const quality of [.84, .73, .62]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (!blob || blob.type !== "image/webp") throw new Error("This browser cannot create WebP files. Try a modern browser.");
        if (blob.size <= MAX_TRANSFER_BYTES) return blob;
      }
      width = Math.min(width, maxEdge[purpose]);
      height = Math.min(height, maxEdge[purpose]);
    }
    throw new Error("This photograph could not be compressed safely. Try a less detailed image.");
  } catch (err) {
    if (err instanceof Error && (err.message.startsWith("This") || err.message.startsWith("Image"))) throw err;
    throw new Error("This image format cannot be decoded by your browser. Try JPG, PNG, or WebP.");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

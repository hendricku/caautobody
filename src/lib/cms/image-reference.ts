export const CMS_IMAGE_FORMATS = {
  webp: { contentType: "image/webp", extension: "webp" },
  png: { contentType: "image/png", extension: "png" },
  jpeg: { contentType: "image/jpeg", extension: "jpg" },
} as const;

export type CmsImageFormat = keyof typeof CMS_IMAGE_FORMATS;

const STAGING_PATH = /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(?:webp|png|jpg)$/i;

export function normaliseCmsImageReference(value: unknown) {
  const image = typeof value === "string" ? value.trim().slice(0, 1000) : "";
  if (!image) return "";
  const path = image.replace(/\\/g, "/");
  const publicPath = path.replace(/^\.?(?:\/public)?\/images\//i, "/images/");
  if (publicPath.startsWith("/images/")) return publicPath;
  try {
    const url = new URL(path);
    if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.pathname.startsWith("/images/")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    return url.toString();
  } catch {
    return path;
  }
}

function hasTraversal(path: string) {
  try { return decodeURIComponent(path).split("/").some((part) => part === ".."); }
  catch { return true; }
}

export function stagingPathFromReference(value: string) {
  try {
    const url = new URL(value, "https://cms.local");
    if (url.pathname !== "/api/admin/media" || [...url.searchParams.keys()].length !== 1) return null;
    const path = url.searchParams.get("path") || "";
    return STAGING_PATH.test(path) ? path : null;
  } catch {
    return null;
  }
}

export function isSafeCmsImageReference(value: string) {
  if (!value) return true;
  if (stagingPathFromReference(value)) return true;
  if ((value.startsWith("/images/") || value.startsWith("/storage/v1/object/public/cms-public/")) && !hasTraversal(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function formatFromStagingPath(path: string): CmsImageFormat | null {
  if (!STAGING_PATH.test(path)) return null;
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "webp" || extension === "png") return extension;
  return extension === "jpg" ? "jpeg" : null;
}

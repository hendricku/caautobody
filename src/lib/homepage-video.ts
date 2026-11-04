export const DEFAULT_HOME_VIDEO_ID = "GREXDcQ2eLc";

// Store only a video ID; never render administrator-supplied embed HTML or URLs.
export function youtubeVideoId(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  const input = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    let id = "";
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(host)) {
      id = url.pathname === "/watch" ? url.searchParams.get("v") || "" : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/)?.[1] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

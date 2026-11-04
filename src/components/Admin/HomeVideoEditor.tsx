"use client";
import { useEffect, useState } from "react";

export default function HomeVideoEditor() {
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState("");
  const [published, setPublished] = useState<string | null>(null);
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/admin/settings/homepage-video", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Video settings unavailable");
      if (active) { setPublished(data.published); setDraft(data.draft || ""); setUrl(data.draft ? `https://www.youtube.com/watch?v=${data.draft}` : ""); setRole(data.role); }
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Video settings unavailable"); });
    return () => { active = false; };
  }, []);
  async function save(action: "draft" | "publish") {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/settings/homepage-video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save video");
      if (action === "draft") { setDraft(data.videoId); setUrl(`https://www.youtube.com/watch?v=${data.videoId}`); setMessage("Draft saved. Preview it before publishing."); }
      else { setPublished(data.videoId); setMessage("Homepage video published."); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save video"); }
    finally { setBusy(false); }
  }
  return <section className="admin-panel"><div className="panel-head"><h2>Homepage video</h2></div><div className="admin-form embedded"><p>Upload your video to YouTube, then paste its link here. The current video stays live until you publish the saved draft.</p><p>Current video: {published === null ? "Loading..." : published || "Website video"}</p><label>YouTube video link<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>{error ? <p role="alert" className="admin-note">{error}</p> : null}{message ? <p role="status" className="admin-note">{message}</p> : null}<div className="home-video-editor__actions"><button type="button" className="admin-primary" disabled={busy || !url} onClick={() => void save("draft")}>Save draft</button>{draft ? <a href="/caautobodyadmin/settings/homepage-video/preview" target="_blank" rel="noopener noreferrer">Preview saved draft</a> : null}{role !== "editor" ? <button type="button" className="admin-primary" disabled={busy || !draft || url !== `https://www.youtube.com/watch?v=${draft}`} onClick={() => void save("publish")}>Publish saved draft</button> : null}</div></div></section>;
}

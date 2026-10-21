"use client";

import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import { prepareCmsUpload, readableImageSize, type CmsImagePurpose } from "@/lib/cms/image-upload-client";

type CmsImageFieldProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
  purpose?: CmsImagePurpose;
  variant?: "default" | "compact";
};

type UploadSummary = { before: number; after: number; width: number; height: number };
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif";

/** Shared CMS image field. Optimizes before transfer, then validates/normalizes
 * to WebP again on the authenticated server. Drafts remain in private staging.
 */
export default function CmsImageField({ id, label = "Featured image", value, onChange, disabled = false,
  hint = "JPG, PNG, WebP, AVIF or supported HEIC. Large photos optimize automatically.", purpose = "content", variant = "default" }: CmsImageFieldProps) {
  const [stage, setStage] = useState<"idle" | "optimizing" | "uploading">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const busy = stage !== "idle";

  useEffect(() => setPreviewFailed(false), [value]);

  async function upload(file: File) {
    if (disabled || busy) return;
    setError(""); setSummary(null); setProgress(0); setStage("optimizing");
    try {
      const optimized = await prepareCmsUpload(file, purpose);
      const data = new FormData();
      data.set("file", new File([optimized], "photo.webp", { type: "image/webp" }));
      data.set("purpose", purpose);
      setStage("uploading");
      const result = await new Promise<{ image: string; width: number; height: number; optimizedBytes: number }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/media");
        xhr.timeout = 90_000;
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
        xhr.onerror = () => reject(new Error("Connection lost while uploading. Please retry."));
        xhr.ontimeout = () => reject(new Error("Upload timed out. Please retry."));
        xhr.onload = () => {
          let body: Record<string, unknown> = {};
          try { body = JSON.parse(xhr.responseText) as Record<string, unknown>; } catch { /* Error fallback below. */ }
          if (xhr.status < 200 || xhr.status >= 300) { reject(new Error(typeof body.error === "string" ? body.error : "Image upload failed")); return; }
          if (typeof body.image !== "string" || typeof body.optimizedBytes !== "number") { reject(new Error("The server returned an invalid image reference.")); return; }
          resolve({ image: body.image, width: Number(body.width), height: Number(body.height), optimizedBytes: body.optimizedBytes });
        };
        xhr.send(data);
      });
      onChange(result.image);
      setSummary({ before: file.size, after: result.optimizedBytes, width: result.width, height: result.height });
      setProgress(100);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to optimize image. Please try again.");
    } finally {
      setStage("idle");
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) void upload(file);
  }
  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault(); setDragging(false);
    if (!disabled && !busy && event.dataTransfer.files[0]) void upload(event.dataTransfer.files[0]);
  }

  // Compact media cards are used in the Service/Brand settings column only.
  // They intentionally share the exact upload, optimization and removal handlers
  // with the original full-width CMS media field.
  if (variant === "compact") {
    return <fieldset className="admin-media-field" disabled={disabled || busy} aria-busy={busy}>
      <legend className="admin-media-field__sr-only">{label}</legend>
      <input id={`${id}-upload`} className="admin-media-field__file" type="file" accept={ACCEPT}
        onChange={chooseFile} disabled={disabled || busy} aria-label={`Choose ${label} photo`}
        aria-describedby={`${id}-upload-status`} />
      <label className={`admin-media-field__visual${purpose === "hero" ? " admin-media-field__visual--hero" : ""}${dragging ? " is-dragging" : ""}`}
        htmlFor={`${id}-upload`} onDragOver={(event) => { event.preventDefault(); if (!disabled && !busy) setDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
        onDrop={handleDrop}>
        {value && !previewFailed ? <>
          {/* The source may be a private staging reference or a user-provided URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={`${label} preview`} referrerPolicy="no-referrer"
            onError={() => setPreviewFailed(true)} />
          <span className="admin-media-field__visual-hint">Click to replace photo</span>
        </> : <span className="admin-media-field__placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5"/></svg>
          <strong>{previewFailed ? "Preview unavailable" : "No image selected"}</strong>
          <span>Click or drop a photo here</span>
        </span>}
        {busy ? <span className="admin-media-field__busy">{stage === "optimizing" ? "Optimizing photo…" : `Uploading ${progress}%`}</span> : null}
      </label>
      {busy ? <progress className="admin-image-upload__progress" max={100} value={stage === "optimizing" ? undefined : progress} aria-label={stage === "optimizing" ? "Optimizing image" : "Uploading image"} /> : null}
      <div className="admin-media-field__actions">
        <label htmlFor={`${id}-upload`} className="admin-media-field__choose">{value ? "Replace image" : "Upload image"}</label>
        {value ? <button type="button" className="admin-media-field__remove" onClick={() => { setSummary(null); setError(""); onChange(""); }}>Remove</button> : null}
      </div>
      <p className="admin-media-field__hint">{hint}</p>
      <div id={`${id}-upload-status`} className="admin-image-upload__feedback" aria-live="polite">
        {error ? <p className="admin-image-upload__error" role="alert">{error}</p> : null}
        {summary ? <p className="admin-image-upload__success"><strong>WebP ready</strong> · {readableImageSize(summary.before)} → {readableImageSize(summary.after)} · {summary.width} × {summary.height}px</p> : null}
      </div>
      <details className="admin-media-field__url"><summary>Use image URL instead</summary>
        <label htmlFor={`${id}-url`}>Image URL</label>
        <input id={`${id}-url`} value={value} onChange={(event) => { setSummary(null); setError(""); onChange(event.target.value); }} placeholder="https://… or /images/…" />
      </details>
    </fieldset>;
  }

  return <fieldset className="admin-image-field" disabled={disabled || busy}>
    <legend>{label}</legend>
    <div className="admin-image-field__controls">
      <label className={`upload-box admin-image-upload${dragging ? " is-dragging" : ""}`} htmlFor={`${id}-upload`}
        onDragOver={(event) => { event.preventDefault(); if (!disabled && !busy) setDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
        onDrop={handleDrop}>
        <span>{stage === "optimizing" ? "Optimizing photo…" : stage === "uploading" ? `Uploading ${progress}%` : "Choose or drop photo"}</span>
        <small>{hint}</small>
        {busy ? <progress className="admin-image-upload__progress" max={100} value={stage === "optimizing" ? undefined : progress} aria-label={stage === "optimizing" ? "Optimizing image" : "Uploading image"} /> : null}
      </label>
      <input id={`${id}-upload`} className="admin-image-field__file" type="file" accept={ACCEPT} onChange={chooseFile} aria-describedby={`${id}-upload-status`} />
      <label className="admin-image-field__url" htmlFor={`${id}-url`}>Or image URL
        <input id={`${id}-url`} value={value} onChange={(event) => { setSummary(null); setError(""); onChange(event.target.value); }} placeholder="https://… or /images/…" />
      </label>
    </div>
    <div id={`${id}-upload-status`} className="admin-image-upload__feedback" aria-live="polite">
      {error ? <p className="admin-image-upload__error" role="alert">{error}</p> : null}
      {summary ? <p className="admin-image-upload__success"><strong>WebP ready</strong> · {readableImageSize(summary.before)} → {readableImageSize(summary.after)} · {summary.width} × {summary.height}px</p> : null}
    </div>
    {value ? <div className="admin-image-preview-wrap">
      {/* External/user-entered URLs and authenticated staging URLs cannot be statically allowlisted. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {!previewFailed ? <img className={purpose === "hero" ? "admin-image-preview admin-image-preview--hero" : "admin-image-preview"} src={value} alt="Selected image preview" referrerPolicy="no-referrer" onError={() => setPreviewFailed(true)} /> : <p className="admin-image-preview__error" role="alert">This image cannot be previewed. Check the URL or choose another image.</p>}
      <button className="admin-image-field__remove" type="button" onClick={() => { setSummary(null); onChange(""); }}>Remove image</button>
    </div> : <p className="admin-image-field__empty">Upload a photograph or enter a valid image link to preview it here.</p>}
  </fieldset>;
}

"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Swal from "sweetalert2";

type CmsImageFieldProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Shared CMS media control. Uploads stay in the private staging bucket until a
 * Publisher or Admin saves the surrounding record as published.
 */
export default function CmsImageField({
  id,
  label = "Featured image",
  value,
  onChange,
  disabled = false,
  hint = "JPG, PNG, or WebP · 5 MB maximum · automatically optimized to high-quality WebP.",
}: CmsImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => setPreviewFailed(false), [value]);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BYTES) {
      await Swal.fire({ icon: "error", text: "Choose an image no larger than 5 MB." });
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Image upload failed");
      if (typeof result.image !== "string") throw new Error("The image upload returned an invalid reference");
      onChange(result.image);
      await Swal.fire({
        icon: "success",
        title: "Image optimized",
        text: "Converted to high-quality WebP and ready to publish.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({ icon: "error", text: error instanceof Error ? error.message : "Image upload failed" });
    } finally {
      setUploading(false);
    }
  }

  return <fieldset className="admin-image-field" disabled={disabled || uploading}>
    <legend>{label}</legend>
    <div className="admin-image-field__controls">
      <label className="upload-box" htmlFor={`${id}-upload`}>
        <span>{uploading ? "Uploading image…" : "Choose image"}</span>
        <small>{hint}</small>
      </label>
      <input id={`${id}-upload`} className="admin-image-field__file" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={chooseFile} />
      <label className="admin-image-field__url" htmlFor={`${id}-url`}>
        Or image URL
        <input id={`${id}-url`} value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://… or /images/…" />
      </label>
    </div>
    {value ? <div className="admin-image-preview-wrap">
      {/* Dynamic authenticated staging paths and administrator-entered HTTPS URLs cannot be safely allowlisted for next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {!previewFailed ? <img className="admin-image-preview" src={value} alt="Selected image preview" referrerPolicy="no-referrer" onError={() => setPreviewFailed(true)} /> : <p className="admin-image-preview__error" role="alert">This image cannot be previewed. Check the URL or choose another image.</p>}
      <button className="admin-image-field__remove" type="button" onClick={() => onChange("")}>Remove image</button>
    </div> : <p className="admin-image-field__empty">Choose a JPG, PNG, or WebP file, or paste a secure image link to see a preview.</p>}
  </fieldset>;
}

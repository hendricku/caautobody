"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import CmsImageField from "@/components/Admin/CmsImageField";
import { useCmsCollection, type CmsCollection } from "@/lib/cms/useCmsCollection";

type Kind = Extract<CmsCollection, "offers" | "areas">;
type Item = { slug: string; title?: string; name?: string; seoTitle: string; eyebrow?: string; intro: string; body: string[]; image: string; bullets?: string[]; coordinates?: [number, number]; mapDescription?: string; status?: "draft" | "published" | "retired" };
const blank = (): Item => ({ slug: "", title: "", name: "", seoTitle: "", eyebrow: "", intro: "", image: "", body: [], bullets: [], coordinates: [0, 0], mapDescription: "", status: "draft" });
const label = (kind: Kind) => kind === "offers" ? "Offer" : "Area";
const slugFrom = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminStructuredEditor({ collection, slug }: { collection: Kind; slug?: string }) {
  const router = useRouter();
  const { items, ready, error, role, save } = useCmsCollection<Item>(collection);
  const record = useMemo(() => slug ? items.find((item) => item.slug === slug) : undefined, [items, slug]);
  const [form, setForm] = useState<Item>(blank());
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const canPublish = role !== "editor";
  const existing = Boolean(record);
  const titleKey = collection === "offers" ? "title" : "name";

  useEffect(() => {
    if (!loaded && (record || (!slug && ready))) {
      const next = record || blank();
      setForm({ ...next, body: [...next.body], bullets: [...(next.bullets || [])], coordinates: [...(next.coordinates || [0, 0])] as [number, number] });
      setLoaded(true);
    }
  }, [loaded, ready, record, slug]);

  async function persist(status: "draft" | "published", thenPreview = false) {
    const title = (collection === "offers" ? form.title : form.name)?.trim() || "";
    const nextSlug = form.slug || slugFrom(title);
    if (!title || !nextSlug) {
      await Swal.fire({ icon: "info", text: `Add a ${collection === "offers" ? "title" : "name"} before saving.` });
      return;
    }
    // Reserve the preview tab within the user's click gesture; browsers can
    // otherwise block a tab opened only after an asynchronous save completes.
    const previewTab = thenPreview ? window.open("about:blank", "_blank") : null;
    if (previewTab) previewTab.opener = null;
    setBusy(true);
    try {
      const saved = await save({ ...form, [titleKey]: title, slug: nextSlug, status, body: form.body.filter(Boolean), bullets: form.bullets?.filter(Boolean) }, record?.slug);
      setForm(saved);
      setDirty(false);
      if (!existing) router.replace(`/caautobodyadmin/${collection}/${saved.slug}`);
      if (thenPreview) { const destination = `/caautobodyadmin/${collection}/${saved.slug}/preview`; if (previewTab && !previewTab.closed) previewTab.location.replace(destination); else window.open(destination, "_blank", "noopener,noreferrer"); }
      void Swal.fire({ icon: "success", title: status === "published" ? `${label(collection)} published` : "Draft saved", timer: 1400, showConfirmButton: false });
    } catch (reason) {
      previewTab?.close();
      void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  }

  function preview() {
    if (existing && form.status === "published") {
      window.open(`/caautobodyadmin/${collection}/${form.slug}/preview`, "_blank", "noopener,noreferrer");
      return;
    }
    void persist("draft", true);
  }

  if (!ready && !loaded) return <p className="admin-loading">Loading {collection} editor...</p>;
  if (slug && !record) return <div className="admin-empty"><strong>{label(collection)} not found</strong><Link className="admin-editor__secondary" href={`/caautobodyadmin/${collection}`}>Back to {collection}</Link></div>;

  return <form className="admin-editor" onInputCapture={() => setDirty(true)} onChangeCapture={() => setDirty(true)} onSubmit={(event) => { event.preventDefault(); void persist(form.status === "published" ? "published" : "draft"); }}>
    <header className="admin-editor__top"><div><Link className="admin-editor__back" href={`/caautobodyadmin/${collection}`}>← All {collection}</Link><label className="admin-editor__title-field"><span>{collection === "offers" ? "Offer title" : "Area name"}</span><input required placeholder={collection === "offers" ? "Add offer title" : "Add area name"} value={collection === "offers" ? form.title || "" : form.name || ""} onChange={(event) => setForm({ ...form, [titleKey]: event.target.value })} /></label><p className="admin-editor__lede">Keep this content private while it is being prepared, then publish it when it is ready.</p></div><div className="admin-editor__status-line">{dirty ? <span className="admin-editor__dirty">Unsaved changes</span> : null}<span className={`admin-status-badge admin-status-badge--${form.status || "draft"}`}>{form.status || "draft"}</span></div></header>
    {error ? <p className="admin-note" role="alert">CMS error: {error}</p> : null}
    <div className="admin-editor__grid"><div className="admin-editor__main">
      <section className="admin-editor__fieldset"><h2 className="admin-editor__section-title">Content</h2>
        <label>Introduction<textarea rows={4} required value={form.intro} onChange={(event) => setForm({ ...form, intro: event.target.value })} /></label>
        <label>Body paragraphs <small>Use a blank line between paragraphs.</small><textarea rows={8} value={form.body.join("\n\n")} onChange={(event) => setForm({ ...form, body: event.target.value.split(/\n\s*\n/) })} /></label>
        {collection === "offers" ? <><label>Section label<input value={form.eyebrow || ""} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} /></label><label>Key points <small>One per line.</small><textarea rows={5} value={(form.bullets || []).join("\n")} onChange={(event) => setForm({ ...form, bullets: event.target.value.split("\n") })} /></label></> : <><label>Map description<textarea rows={4} value={form.mapDescription || ""} onChange={(event) => setForm({ ...form, mapDescription: event.target.value })} /></label><div className="admin-form-row"><label>Latitude<input type="number" step="any" value={form.coordinates?.[0] ?? 0} onChange={(event) => setForm({ ...form, coordinates: [Number(event.target.value), form.coordinates?.[1] ?? 0] })} /></label><label>Longitude<input type="number" step="any" value={form.coordinates?.[1] ?? 0} onChange={(event) => setForm({ ...form, coordinates: [form.coordinates?.[0] ?? 0, Number(event.target.value)] })} /></label></div></>}
      </section>
    </div><aside className="admin-editor__aside"><section className="admin-editor__panel"><h2>Publish</h2><p>{canPublish ? "Save a Draft while work is in progress. Publish only when the page is approved." : "Your role can save drafts. A Publisher or Admin can make the page public."}</p><div className="admin-editor__actions"><button className="admin-editor__secondary" type="button" disabled={busy} onClick={preview}>{form.status === "published" ? "Preview published page" : "Preview draft"}</button><button className="admin-editor__secondary" type="button" disabled={busy} onClick={() => void persist("draft")}>{busy ? "Saving..." : "Save draft"}</button>{canPublish ? <button className="admin-primary" type="button" disabled={busy} onClick={() => void persist("published")}>{busy ? "Publishing..." : form.status === "published" ? `Update ${label(collection).toLowerCase()}` : `Publish ${label(collection).toLowerCase()}`}</button> : null}<Link className="admin-editor__secondary" href={`/caautobodyadmin/${collection}`}>Cancel</Link></div></section>
      <section className="admin-editor__panel"><h2>Featured image</h2><CmsImageField id={`${collection}-featured-image`} label="Featured image" purpose="featured" value={form.image} onChange={(image) => { setDirty(true); setForm({ ...form, image }); }} /></section>
      <section className="admin-editor__panel"><h2>Page settings</h2><label>URL slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Created from title" /></label><label>SEO title<input value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></label></section>
      <p className="admin-editor__notice">Preview uses the most recently saved version. Draft pages stay private; previewing a published page never unpublishes it.</p></aside></div>
  </form>;
}

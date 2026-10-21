"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import CmsImageField from "@/components/Admin/CmsImageField";
import { useCmsCollection, type CmsCollection } from "@/lib/cms/useCmsCollection";
import { faqCategories } from "@/lib/siteContent";

type Kind = Extract<CmsCollection, "faqs" | "gallery">;
type Faq = { id: string; category: string; question: string; answer: string; visible: boolean; status?: "draft" | "published" | "retired" };
type Gallery = { id: string; image: string; caption: string; category: string; status?: "draft" | "published" | "retired" };

const blankFaq: Faq = { id: "", category: "General", question: "", answer: "", visible: true, status: "draft" };
const blankGallery: Gallery = { id: "", image: "", caption: "", category: "Workshop", status: "draft" };

export default function AdminLibraryEditor({ collection, id }: { collection: Kind; id?: string }) {
  const router = useRouter();
  const { items, ready, error, role, save } = useCmsCollection<Faq | Gallery>(collection);
  const record = useMemo(() => id ? items.find((item) => item.id === id) : undefined, [id, items]);
  const [form, setForm] = useState<Faq | Gallery>(collection === "faqs" ? blankFaq : blankGallery);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!loaded && (record || (!id && ready))) {
      setForm(record || (collection === "faqs" ? blankFaq : blankGallery));
      setLoaded(true);
    }
  }, [collection, id, loaded, ready, record]);

  const canPublish = role !== "editor";
  const noun = collection === "faqs" ? "FAQ" : "gallery image";
  const existing = Boolean(record);

  async function persist(status: "draft" | "published", thenPreview = false) {
    if (collection === "faqs" && (!(form as Faq).question.trim() || !(form as Faq).answer.trim())) {
      await Swal.fire({ icon: "info", text: "Add both a question and answer before saving." });
      return;
    }
    if (collection === "gallery" && (!(form as Gallery).caption.trim() || !(form as Gallery).image)) {
      await Swal.fire({ icon: "info", text: "Add a caption and image before saving." });
      return;
    }

    // Reserve the preview tab within the user's click gesture; browsers can
    // otherwise block a tab opened only after an asynchronous save completes.
    const previewTab = thenPreview ? window.open("about:blank", "_blank") : null;
    if (previewTab) previewTab.opener = null;
    setBusy(true);
    try {
      const saved = await save({ ...form, status }, record?.id);
      setForm(saved);
      setDirty(false);
      if (!existing) router.replace(`/caautobodyadmin/${collection}/${encodeURIComponent(saved.id)}`);
      if (thenPreview) { const destination = `/caautobodyadmin/${collection}/${encodeURIComponent(saved.id)}/preview`; if (previewTab && !previewTab.closed) previewTab.location.replace(destination); else window.open(destination, "_blank", "noopener,noreferrer"); }
      void Swal.fire({ icon: "success", title: thenPreview ? "Draft saved for preview" : status === "published" ? `${noun} published` : "Draft saved", timer: 1400, showConfirmButton: false });
    } catch (reason) {
      previewTab?.close();
      void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  }

  function preview() {
    if (existing && form.status === "published") {
      window.open(`/caautobodyadmin/${collection}/${encodeURIComponent(form.id)}/preview`, "_blank", "noopener,noreferrer");
      return;
    }
    void persist("draft", true);
  }

  if (!ready && !loaded) return <p className="admin-loading">Loading editor...</p>;
  if (id && !record) return <div className="admin-empty"><strong>Content not found</strong><Link className="admin-editor__secondary" href={`/caautobodyadmin/${collection}`}>Back to {collection}</Link></div>;

  return <form className="admin-editor" onInputCapture={() => setDirty(true)} onChangeCapture={() => setDirty(true)} onSubmit={(event) => { event.preventDefault(); void persist(form.status === "published" ? "published" : "draft"); }}>
    <header className="admin-editor__top">
      <div><Link className="admin-editor__back" href={`/caautobodyadmin/${collection}`}>← All {collection}</Link><label className="admin-editor__title-field"><span>{collection === "faqs" ? "FAQ question" : "Image caption"}</span>{collection === "faqs" ? <input aria-label="FAQ question" required value={(form as Faq).question} onChange={(event) => setForm({ ...(form as Faq), question: event.target.value })} placeholder="Enter the FAQ question" /> : <input aria-label="Image caption" required value={(form as Gallery).caption} onChange={(event) => setForm({ ...(form as Gallery), caption: event.target.value })} placeholder="Enter the image caption" />}</label><p className="admin-editor__lede">Prepare the content as a Draft, then publish only when it is ready for the public website.</p></div>
      <div className="admin-editor__status-line">{dirty ? <span className="admin-editor__dirty">Unsaved changes</span> : null}<span className={`admin-status-badge admin-status-badge--${form.status || "draft"}`}>{form.status || "draft"}</span></div>
    </header>
    {error ? <p className="admin-note" role="alert">CMS error: {error}</p> : null}
    <div className="admin-editor__grid">
      <div className="admin-editor__main"><section className="admin-editor__fieldset"><h2 className="admin-editor__section-title">{collection === "faqs" ? "Question and answer" : "Image details"}</h2>
        {collection === "faqs" ? <>
          <label>Answer<textarea rows={9} required value={(form as Faq).answer} onChange={(event) => setForm({ ...(form as Faq), answer: event.target.value })} /></label>
          <div className="admin-form-row"><label>Category<input required list="faq-category-options" value={(form as Faq).category} onChange={(event) => setForm({ ...(form as Faq), category: event.target.value })} /><datalist id="faq-category-options">{faqCategories.map((category) => <option key={category} value={category} />)}</datalist></label><label className="check-label"><input type="checkbox" checked={(form as Faq).visible} onChange={(event) => setForm({ ...(form as Faq), visible: event.target.checked })} />Visible on the public FAQ page</label></div>
        </> : <>
          <label>Category<input value={(form as Gallery).category} onChange={(event) => setForm({ ...(form as Gallery), category: event.target.value })} /></label>
        </>}
      </section></div>
      <aside className="admin-editor__aside"><section className="admin-editor__panel"><h2>Publish</h2><p>{canPublish ? "Save a Draft first. Publish only when the content is approved." : "Your role can save drafts. A Publisher or Admin can publish content."}</p><div className="admin-editor__actions">
        <button className="admin-editor__secondary" type="button" disabled={busy} onClick={() => void persist("draft")}>{busy ? "Saving..." : "Save draft"}</button>
        <button className="admin-editor__secondary" type="button" disabled={busy} onClick={preview}>Preview</button>
        {canPublish ? <button className="admin-primary" type="button" disabled={busy} onClick={() => void persist("published")}>{busy ? "Publishing..." : form.status === "published" ? "Update" : "Publish"}</button> : null}
        <Link className="admin-editor__secondary" href={`/caautobodyadmin/${collection}`}>Cancel</Link>
      </div></section>
        {collection === "gallery" ? <section className="admin-editor__panel"><h2>Featured image</h2><CmsImageField id="gallery-image" label="Gallery image" purpose="gallery" value={(form as Gallery).image} onChange={(image) => { setDirty(true); setForm({ ...(form as Gallery), image }); }} /></section> : null}
        <p className="admin-editor__notice">Preview uses the saved version. For an unsaved new record, Preview saves it as a private Draft first.</p></aside>
    </div>
  </form>;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import CmsImageField from "@/components/Admin/CmsImageField";
import ServiceLayoutEditor from "@/components/Admin/ServiceLayoutEditor";
import { useCmsCollection } from "@/lib/cms/useCmsCollection";
import type { CmsServiceContent, ServicePresentation } from "@/lib/cms/public-content";

const blank: CmsServiceContent = {
  slug: "", title: "", seoTitle: "", eyebrow: "", intro: "", body: [""], image: "", highlights: [], status: "draft",
  placement: { navigation: true, navigationLabel: "", navigationSummary: "", homeSlider: true, sliderLabel: "", sliderKicker: "", sliderCopy: "", sliderCta: "" },
};

function editorValue(value: CmsServiceContent): CmsServiceContent {
  return { ...value, body: [...value.body], highlights: [...value.highlights], placement: { ...value.placement } };
}

function slugFrom(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminServiceEditor({ slug }: { slug?: string }) {
  const router = useRouter();
  const { items, ready, error, role, save } = useCmsCollection<CmsServiceContent>("services");
  const item = useMemo(() => slug ? items.find((entry) => entry.slug === slug) : undefined, [items, slug]);
  const [form, setForm] = useState<CmsServiceContent>(blank);
  const [presentation, setPresentation] = useState<ServicePresentation>({ variant: "standard" });
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const canPublish = role !== "editor";
  const isExisting = Boolean(item?.slug);

  useEffect(() => {
    if (!loaded && (item || (!slug && ready))) {
      const next = editorValue(item || blank);
      setForm(next);
      setPresentation(next.presentation || { variant: "standard" });
      setLoaded(true);
    }
  }, [item, loaded, ready, slug]);

  async function persist(status: "draft" | "published", thenPreview = false) {
    const title = form.title.trim();
    const nextSlug = form.slug || slugFrom(title);
    if (!title || !nextSlug) {
      await Swal.fire({ icon: "info", text: "Add a service name before saving." });
      return;
    }
    // Reserve the preview tab within the user's click gesture; browsers can
    // otherwise block a tab opened only after an asynchronous save completes.
    const previewTab = thenPreview ? window.open("about:blank", "_blank") : null;
    if (previewTab) previewTab.opener = null;
    setBusy(true);
    try {
      const saved = await save({ ...form, title, slug: nextSlug, status, presentation, body: form.body.filter(Boolean), highlights: form.highlights.filter(Boolean) }, item?.slug);
      setForm(editorValue(saved));
      setPresentation(saved.presentation || { variant: "standard" });
      setDirty(false);
      if (!isExisting) router.replace(`/caautobodyadmin/services/${saved.slug}`);
      if (thenPreview) { const destination = `/caautobodyadmin/services/${saved.slug}/preview`; if (previewTab && !previewTab.closed) previewTab.location.replace(destination); else window.open(destination, "_blank", "noopener,noreferrer"); }
      void Swal.fire({ icon: "success", title: status === "published" ? "Service published" : "Draft saved", timer: 1500, showConfirmButton: false });
    } catch (reason) {
      previewTab?.close();
      void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : "Unable to save service" });
    } finally {
      setBusy(false);
    }
  }

  function preview() {
    if (isExisting && form.status === "published") {
      window.open(`/caautobodyadmin/services/${form.slug}/preview`, "_blank", "noopener,noreferrer");
      return;
    }
    void persist("draft", true);
  }

  if (!ready && !loaded) return <p className="admin-loading">Loading service editor...</p>;
  if (slug && !item) return <div className="admin-empty"><strong>Service not found</strong><p>This record may have been retired or its address changed.</p><Link className="admin-editor__secondary" href="/caautobodyadmin/services">Back to Services</Link></div>;

  const updatePlacement = (key: keyof CmsServiceContent["placement"], value: string | boolean) => setForm({ ...form, placement: { ...form.placement, [key]: value } });
  // Keep the existing service background/brand hero references in sync. Each
  // right-hand image is a separate presentation field, never the hero URL.
  const heroBackground = presentation.variant === "brand" ? (presentation.data.heroImage || form.image) : form.image;
  const rightImage = presentation.variant === "standard" ? "" : (presentation.data.rightImage || "");
  function updateHeroBackground(image: string) {
    setDirty(true);
    setForm((current) => ({ ...current, image }));
    setPresentation((current) => current.variant === "brand"
      ? { ...current, data: { ...current.data, heroImage: image } }
      : current);
  }
  function updateRightImage(image: string) {
    setDirty(true);
    setPresentation((current): ServicePresentation => {
      // Preserve the discriminant/data relationship for each page layout.
      // Editorial and brand image fields are independent of the hero image.
      if (current.variant === "editorial") {
        return { variant: "editorial", data: { ...current.data, rightImage: image } };
      }
      if (current.variant === "brand") {
        return { variant: "brand", data: { ...current.data, rightImage: image } };
      }
      return current;
    });
  }
  return <form className="admin-editor" onInputCapture={() => setDirty(true)} onChangeCapture={() => setDirty(true)} onSubmit={(event) => { event.preventDefault(); void persist(form.status === "published" ? "published" : "draft"); }}>
    <header className="admin-editor__top">
      <div><Link className="admin-editor__back" href="/caautobodyadmin/services">← All services</Link><label className="admin-editor__title-field"><span>Service title</span><input required aria-label="Service title" placeholder="Add service title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><p className="admin-editor__lede">Build the page, choose its website placement, and keep it private until it is approved.</p></div>
      <div className="admin-editor__status-line">{dirty ? <span className="admin-editor__dirty">Unsaved changes</span> : null}<span className={`admin-status-badge admin-status-badge--${form.status || "draft"}`}>{form.status || "draft"}</span></div>
    </header>
    {error ? <p className="admin-note" role="alert">CMS error: {error}</p> : null}
    <div className="admin-editor__grid"><div className="admin-editor__main">
      <section className="admin-editor__fieldset"><h2 className="admin-editor__section-title">Hero & opening content</h2>
        <label>Section label<input value={form.eyebrow} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} placeholder="Optional short label" /></label>
        <label>Introduction<textarea rows={4} value={form.intro} onChange={(event) => setForm({ ...form, intro: event.target.value })} /></label>
        <label>Body paragraphs <small>Use a blank line between paragraphs.</small><textarea rows={8} value={form.body.join("\n\n")} onChange={(event) => setForm({ ...form, body: event.target.value.split(/\n\s*\n/) })} /></label>
        <label>Highlights <small>One per line.</small><textarea rows={5} value={form.highlights.join("\n")} onChange={(event) => setForm({ ...form, highlights: event.target.value.split("\n") })} /></label>
      </section>
      <section className="admin-editor__fieldset"><h2 className="admin-editor__section-title">Page layout</h2><p>Choose the service page structure and manage its labelled content. This saves structured content rather than raw JSON.</p><ServiceLayoutEditor value={presentation} onChange={(next) => { setDirty(true); setPresentation(next); }} /></section>
      <section className="admin-editor__fieldset"><h2 className="admin-editor__section-title">Website placement</h2><p>Only published services can be displayed in the Services menu or homepage slider.</p>
        <div className="admin-form-row"><label>Menu label<input value={form.placement.navigationLabel} onChange={(event) => updatePlacement("navigationLabel", event.target.value)} placeholder={form.title || "Service name"} /></label><label>Menu summary<input value={form.placement.navigationSummary} onChange={(event) => updatePlacement("navigationSummary", event.target.value)} placeholder={form.intro || "Short service summary"} /></label></div>
        <div className="admin-form-row"><label>Slider label<input value={form.placement.sliderLabel} onChange={(event) => updatePlacement("sliderLabel", event.target.value)} placeholder={form.title || "Service name"} /></label><label>Slider kicker<input value={form.placement.sliderKicker} onChange={(event) => updatePlacement("sliderKicker", event.target.value)} placeholder={form.eyebrow || "CA Autobody service"} /></label></div>
        <label>Slider copy<textarea rows={3} value={form.placement.sliderCopy} onChange={(event) => updatePlacement("sliderCopy", event.target.value)} placeholder={form.intro || "Short homepage description"} /></label>
        <label>Slider button label<input value={form.placement.sliderCta} onChange={(event) => updatePlacement("sliderCta", event.target.value)} placeholder={form.title ? `Explore ${form.title}` : "Explore service"} /></label>
      </section>
    </div><aside className="admin-editor__aside admin-editor__aside--service"><section className="admin-editor__panel"><h2>Publish</h2><p>{canPublish ? "Save a Draft while work is in progress. Publish only when the page is approved." : "Your role can create and update Drafts. A Publisher or Admin can publish the final page."}</p><label>Current status<select value={form.status || "draft"} onChange={(event) => setForm({ ...form, status: event.target.value as CmsServiceContent["status"] })}><option value="draft">Draft</option><option value="published" disabled={!canPublish}>Published</option></select></label><div className="admin-editor__actions"><button className="admin-editor__secondary" type="button" disabled={busy} onClick={preview}>{form.status === "published" ? "Preview published page" : "Preview draft"}</button><button className="admin-editor__secondary" type="button" disabled={busy} onClick={() => void persist("draft")}>{busy ? "Saving..." : "Save draft"}</button>{canPublish ? <button className="admin-primary" type="button" disabled={busy} onClick={() => void persist("published")}>{busy ? "Publishing..." : isExisting && form.status === "published" ? "Update service" : "Publish service"}</button> : null}<Link className="admin-editor__secondary" href="/caautobodyadmin/services">Cancel</Link></div></section>
      <section className="admin-editor__panel"><h2>Page settings</h2><label>URL slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Created from service name" /></label><label>SEO title<input value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></label><label className="check-label"><input type="checkbox" checked={form.placement.navigation} onChange={(event) => updatePlacement("navigation", event.target.checked)} />Show in Services menu</label><label className="check-label"><input type="checkbox" checked={form.placement.homeSlider} onChange={(event) => updatePlacement("homeSlider", event.target.checked)} />Show in homepage slider</label></section>
      <section className="admin-editor__panel admin-editor__media-panel" aria-labelledby="service-hero-panel-title">
        <div className="admin-editor__media-heading"><div><h2 id="service-hero-panel-title">Hero background</h2><p>Wide backdrop behind the page heading.</p></div><span className="admin-editor__media-tag">Landscape</span></div>
        <CmsImageField id="service-hero-background" label="Hero background" purpose="hero" variant="compact"
          hint="Automatically optimized to WebP." value={heroBackground} onChange={updateHeroBackground} />
      </section>
      {presentation.variant !== "standard" ? <section className="admin-editor__panel admin-editor__media-panel" aria-labelledby="service-right-panel-title">
        <div className="admin-editor__media-heading"><div><h2 id="service-right-panel-title">Right-side image</h2><p>Independent photo beside the hero copy.</p></div><span className="admin-editor__media-tag">Any ratio</span></div>
        <CmsImageField id="service-right-side" label="Right-side image" purpose="content" variant="compact"
          hint="Portrait or landscape · WebP optimized." value={rightImage} onChange={updateRightImage} />
        <p className="admin-editor__media-hint">Displayed separately beside hero copy after publication.</p>
      </section> : null}
      <p className="admin-editor__notice">Preview reflects saved content. Save your changes before opening it.</p></aside></div>
  </form>;
}

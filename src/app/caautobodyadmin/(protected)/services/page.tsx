"use client";
import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import AdminModal from "@/components/Admin/AdminModal";
import CmsImageField from "@/components/Admin/CmsImageField";
import { useCmsCollection } from "@/lib/cms/useCmsCollection";
import type { CmsServiceContent } from "@/lib/cms/public-content";
const blank: CmsServiceContent = {
  slug: "",
  title: "",
  seoTitle: "",
  eyebrow: "",
  intro: "",
  body: [""],
  image: "",
  highlights: [],
  status: "draft",
  placement: { navigation: true, navigationLabel: "", navigationSummary: "", homeSlider: true, sliderLabel: "", sliderKicker: "", sliderCopy: "", sliderCta: "" },
};
export default function AdminServices() {
  const { items, save, retire, duplicate, error, reload, role, lastSynced } = useCmsCollection<CmsServiceContent>("services");
  const [presentationJson,setPresentationJson] = useState("");
  const [editing, setEditing] = useState<CmsServiceContent | null>(null);
  const [form, setForm] = useState<CmsServiceContent>(blank);
  const edit = (item?: CmsServiceContent) => {
    const value = item || blank;
    setEditing({ ...value });
    setPresentationJson(JSON.stringify(value.presentation || {variant:"standard"},null,2));
    setForm({
      ...value,
      body: [...value.body],
      highlights: [...value.highlights],
      placement: { ...value.placement },
    });
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try {
      const presentation = JSON.parse(presentationJson);
      if (!presentation || typeof presentation !== "object" || !["standard","editorial","brand"].includes(presentation.variant)) throw new Error("Invalid service layout data");
      await save({ ...form, slug, presentation, body: form.body.filter(Boolean), highlights: form.highlights.filter(Boolean) }, editing?.slug); setEditing(null); void Swal.fire({ icon: "success", title: editing?.slug ? "Service updated" : "Service created", timer: 1700, showConfirmButton: false });
    }
    catch (err) { void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Save failed" }); }
  };
  const remove = async (slug: string, title: string) => {
    const confirmation = await Swal.fire({ icon: "warning", title: `Retire “${title}”?`, text: "This will unpublish the service. Historical content will be retained.", showCancelButton: true, confirmButtonText: "Retire service", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (confirmation.isConfirmed) { try { await retire(slug); void Swal.fire({ icon: "success", title: "Service retired", timer: 1600, showConfirmButton: false }); } catch (err) { void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Unable to retire" }); } }
  };
  const duplicateService = async (item: CmsServiceContent) => {
    try {
      const copy = await duplicate(item.slug);
      edit(copy);
      void Swal.fire({ icon: "success", title: "Draft copy created", timer: 1400, showConfirmButton: false });
    } catch (err) { void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Unable to duplicate service" }); }
  };
  return (
    <>
      <div className="admin-page-head">
        <div>
          <span>Website structure</span>
          <h1>Services</h1>
          <p>Manage service-page content, images and route-ready metadata.</p>
        </div>
        <button className="admin-primary" onClick={() => edit()}>
          + New service
        </button>
      </div>
      <div className="admin-toolbar">
        <span>{items.length} service routes · {lastSynced ? "Live sync active" : "Syncing"}</span>
        <button onClick={() => void reload()}>Refresh CMS</button>
      </div>
      {error ? <p className="admin-note" role="alert">CMS error: {error}</p> : null}
      <div className="admin-card-grid">
        {items.map((item) => (
          <article className="admin-content-card" key={item.slug}>
            <img src={item.image || "/images/hero-left-car.jpg"} alt="" />
            <div>
              <span>{item.eyebrow}</span>
              <h2>{item.title}</h2>
              <p>{item.intro}</p>
              <small>/services/{item.slug}{item.placement.navigation ? " · Services menu" : ""}{item.placement.homeSlider ? " · Homepage slider" : ""}</small>
              <div className="table-actions">
                <button onClick={() => edit(item)}>Edit</button>
                <button onClick={() => void duplicateService(item)}>Duplicate</button>
                <button className="admin-danger" onClick={() => void remove(item.slug, item.title)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {editing ? (
        <AdminModal
          title={editing.slug ? "Edit service" : "New service"}
          onClose={() => setEditing(null)}
        >
          <form className="admin-form" onSubmit={(event) => void submit(event)}>
            <label>
              Service name
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              SEO title
              <input
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              />
            </label>
            <div className="admin-form-row">
              <label>
                Eyebrow
                <input
                  value={form.eyebrow}
                  onChange={(e) =>
                    setForm({ ...form, eyebrow: e.target.value })
                  }
                />
              </label>
              <label>
                Slug
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </label>
            </div>
            <CmsImageField id="service-featured-image" label="Hero image" value={form.image} onChange={(image) => setForm({ ...form, image })} />
            <label>
              Intro
              <textarea
                rows={4}
                value={form.intro}
                onChange={(e) => setForm({ ...form, intro: e.target.value })}
              />
            </label>
            <label>
              Body paragraphs
              <textarea
                rows={6}
                value={form.body.join("\n\n")}
                onChange={(e) =>
                  setForm({ ...form, body: e.target.value.split(/\n\s*\n/) })
                }
              />
            </label>
            <label>
              Highlights (one per line)
              <textarea
                rows={5}
                value={form.highlights.join("\n")}
                onChange={(e) =>
                  setForm({ ...form, highlights: e.target.value.split("\n") })
                }
              />
            </label>
            <label>Approved service layout content (JSON) — editorial and brand pages use this structured copy<textarea rows={8} value={presentationJson} onChange={event=>setPresentationJson(event.target.value)} spellCheck={false}/></label>
            <fieldset className="admin-placement">
              <legend>Website placement</legend>
              <p>Published services can appear in the Services menu and homepage slider. Drafts remain private.</p>
              <div className="admin-form-row">
                <label className="check-label"><input type="checkbox" checked={form.placement.navigation} onChange={(event) => setForm({ ...form, placement: { ...form.placement, navigation: event.target.checked } })} />Show in Services menu</label>
                <label className="check-label"><input type="checkbox" checked={form.placement.homeSlider} onChange={(event) => setForm({ ...form, placement: { ...form.placement, homeSlider: event.target.checked } })} />Show in homepage slider</label>
              </div>
              <div className="admin-form-row">
                <label>Menu label<input value={form.placement.navigationLabel} onChange={(event) => setForm({ ...form, placement: { ...form.placement, navigationLabel: event.target.value } })} placeholder={form.title || "Service name"} /></label>
                <label>Menu summary<input value={form.placement.navigationSummary} onChange={(event) => setForm({ ...form, placement: { ...form.placement, navigationSummary: event.target.value } })} placeholder={form.intro || "Short service summary"} /></label>
              </div>
              <div className="admin-form-row">
                <label>Slider label<input value={form.placement.sliderLabel} onChange={(event) => setForm({ ...form, placement: { ...form.placement, sliderLabel: event.target.value } })} placeholder={form.title || "Service name"} /></label>
                <label>Slider kicker<input value={form.placement.sliderKicker} onChange={(event) => setForm({ ...form, placement: { ...form.placement, sliderKicker: event.target.value } })} placeholder={form.eyebrow || "CA Autobody service"} /></label>
              </div>
              <label>Slider copy<textarea rows={3} value={form.placement.sliderCopy} onChange={(event) => setForm({ ...form, placement: { ...form.placement, sliderCopy: event.target.value } })} placeholder={form.intro || "Short homepage description"} /></label>
              <label>Slider button label<input value={form.placement.sliderCta} onChange={(event) => setForm({ ...form, placement: { ...form.placement, sliderCta: event.target.value } })} placeholder={form.title ? `Explore ${form.title}` : "Explore service"} /></label>
            </fieldset>
            <p className="admin-note">For existing SEO service pages, edit the structured layout copy above to change the visible page text. The overview fields are also saved for SEO and standard layouts.</p>
            <label>Publication status<select value={form.status || "draft"} onChange={event=>setForm({...form,status:event.target.value as CmsServiceContent["status"]})}><option value="draft">Draft</option><option value="published" disabled={role==="editor"}>Published</option></select></label>
            <div className="admin-form-actions">
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="admin-primary" type="submit">
                Save service
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </>
  );
}

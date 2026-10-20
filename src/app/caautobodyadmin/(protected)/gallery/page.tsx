"use client";

import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import AdminModal from "@/components/Admin/AdminModal";
import CmsImageField from "@/components/Admin/CmsImageField";
import { useCmsCollection } from "@/lib/cms/useCmsCollection";
import type { GalleryContent } from "@/types/content";

const blank: GalleryContent = { id: "", image: "", caption: "", category: "Workshop", status: "draft" };

export default function AdminGallery() {
  const { items, save, retire, duplicate, error, reload, role, lastSynced } = useCmsCollection<GalleryContent>("gallery");
  const [editing, setEditing] = useState<GalleryContent | null>(null);
  const [form, setForm] = useState(blank);
  const edit = (item?: GalleryContent) => { const value = item || { ...blank, id: `gallery-${Date.now()}` }; setEditing(value); setForm(value); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try { await save(form, editing?.caption ? editing.id : undefined); setEditing(null); void Swal.fire({ icon: "success", title: editing?.caption ? "Gallery image updated" : "Gallery image created", timer: 1700, showConfirmButton: false }); }
    catch (err) { void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Save failed" }); }
  };
  const remove = async (item: GalleryContent) => {
    const confirmation = await Swal.fire({ icon: "warning", title: `Retire “${item.caption}”?`, text: "The gallery image will be unpublished. Its storage file is retained for recovery.", showCancelButton: true, confirmButtonText: "Retire image", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (confirmation.isConfirmed) { try { await retire(item.id); void Swal.fire({ icon: "success", title: "Gallery image retired", timer: 1600, showConfirmButton: false }); } catch (err) { void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Unable to retire" }); } }
  };
  const duplicateGalleryItem = async (item: GalleryContent) => {
    try {
      const copy = await duplicate(item.id);
      edit(copy);
      void Swal.fire({ icon: "success", title: "Draft copy created", timer: 1400, showConfirmButton: false });
    } catch (err) { void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Unable to duplicate gallery item" }); }
  };

  return <>
    <div className="admin-page-head"><div><span>Media</span><h1>Gallery</h1><p>Upload, caption and organize workshop imagery. WebP media is saved to Supabase Storage; publication requires publisher approval.</p></div><button className="admin-primary" onClick={() => edit()}>+ Add image</button></div>
    <div className="admin-toolbar"><span>{items.length} gallery items · {lastSynced ? "Live sync active" : "Syncing"}</span><button onClick={() => void reload()}>Refresh CMS</button></div>
    {error ? <p role="alert" className="admin-note">CMS error: {error}</p> : null}
    <div className="admin-gallery-grid">{items.map((item) => <article key={item.id}><img src={item.image} alt={item.caption} /><div><small>{item.category} · {item.status === "published" ? "Published" : "Draft"}</small><strong>{item.caption}</strong><span className="table-actions"><button onClick={() => edit(item)}>Edit</button><button onClick={() => void duplicateGalleryItem(item)}>Duplicate</button><button className="admin-danger" onClick={() => void remove(item)}>Retire</button></span></div></article>)}</div>
    {editing ? <AdminModal title="Gallery item" onClose={() => setEditing(null)}><form className="admin-form" onSubmit={(event) => void submit(event)}><CmsImageField id="gallery-image" label="Gallery image" value={form.image} onChange={(image) => setForm({ ...form, image })} /><div className="admin-form-row"><label>Caption<input required value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} /></label><label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label></div><label>Publication status<select value={form.status || "draft"} onChange={event=>setForm({...form,status:event.target.value as GalleryContent["status"]})}><option value="draft">Draft</option><option value="published" disabled={role==="editor"}>Published</option></select></label><div className="admin-form-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className="admin-primary" type="submit">Save image</button></div></form></AdminModal> : null}
  </>;
}

"use client";

import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import AdminModal from "@/components/Admin/AdminModal";
import { useLocalCollection } from "@/lib/adminStore";
import { gallery as seedGallery } from "@/lib/siteContent";
import type { GalleryContent } from "@/types/content";

const blank: GalleryContent = { id: "", image: "", caption: "", category: "Workshop" };

export default function AdminGallery() {
  const { items, setItems, reset } = useLocalCollection<GalleryContent>("ca-admin-gallery", seedGallery);
  const [editing, setEditing] = useState<GalleryContent | null>(null);
  const [form, setForm] = useState(blank);
  const edit = (item?: GalleryContent) => { const value = item || { ...blank, id: `gallery-${Date.now()}` }; setEditing(value); setForm(value); };
  const submit = (event: FormEvent) => { event.preventDefault(); setItems((current) => current.some((item) => item.id === form.id) ? current.map((item) => item.id === form.id ? form : item) : [form, ...current]); setEditing(null); };
  const chooseFile = (file?: File) => { if (file) setForm((current) => ({ ...current, image: URL.createObjectURL(file), caption: current.caption || file.name.replace(/\.[^.]+$/, "") })); };
  async function remove(item: GalleryContent) {
    const confirmation = await Swal.fire({ icon: "warning", title: `Delete “${item.caption}”?`, text: "This local gallery entry will be removed from this browser.", showCancelButton: true, confirmButtonText: "Delete image", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (confirmation.isConfirmed) setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return <>
    <div className="admin-page-head"><div><span>Media</span><h1>Gallery</h1><p>Upload, caption and organize workshop imagery. Browser uploads are temporary until Supabase Storage is connected.</p></div><button className="admin-primary" onClick={() => edit()}>+ Add image</button></div>
    <div className="admin-toolbar"><span>{items.length} gallery items</span><button onClick={reset}>Reset mock data</button></div>
    <div className="admin-gallery-grid">{items.map((item) => <article key={item.id}><img src={item.image} alt={item.caption} /><div><small>{item.category}</small><strong>{item.caption}</strong><span className="table-actions"><button onClick={() => edit(item)}>Edit</button><button className="admin-danger" onClick={() => void remove(item)}>Delete</button></span></div></article>)}</div>
    {editing ? <AdminModal title="Gallery item" onClose={() => setEditing(null)}><form className="admin-form" onSubmit={submit}><label className="upload-box">Choose image<input type="file" accept="image/*" onChange={(event) => chooseFile(event.target.files?.[0])} /><span>Upload a local preview image</span></label><label>Or image URL<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label>{form.image ? <img className="admin-image-preview" src={form.image} alt="Preview" /> : null}<div className="admin-form-row"><label>Caption<input required value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} /></label><label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label></div><div className="admin-form-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className="admin-primary" type="submit">Save image</button></div></form></AdminModal> : null}
  </>;
}

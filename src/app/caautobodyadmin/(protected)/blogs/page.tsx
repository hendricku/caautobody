"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import AdminModal from "@/components/Admin/AdminModal";
import CmsImageField from "@/components/Admin/CmsImageField";
import { useCmsCollection } from "@/lib/cms/useCmsCollection";
import { defaultBlogBlocks, getBlogBlocks } from "@/lib/blogContent";
import type { BlogContent } from "@/types/content";

const blank: BlogContent = { slug: "", title: "", date: "", category: "CA Knows", excerpt: "", image: "", status: "draft" };

export default function AdminBlogs() {
  const router = useRouter();
  const { items, save, retire, duplicate, error, role, ready, reload, lastSynced } = useCmsCollection<BlogContent>("blogs");
  const [editing, setEditing] = useState<BlogContent | null>(null);
  const [form, setForm] = useState<BlogContent>(blank);
  const openNew = () => { const next = { ...blank, date: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) }; setForm(next); setEditing(next); };
  const openEdit = (item: BlogContent) => { const next = { ...item, blocks: getBlogBlocks(item) }; setForm(next); setEditing(next); };
  async function submit(event: FormEvent) {
    event.preventDefault();
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const next = { ...form, slug, blocks: form.blocks?.length ? form.blocks : defaultBlogBlocks({ ...form, slug }) };
    try { await save(next, editing?.slug); setEditing(null); void Swal.fire({ icon: "success", title: editing?.slug ? "Blog updated" : "Blog created", timer: 1700, showConfirmButton: false }); }
    catch (error) { void Swal.fire({ icon: "error", text: error instanceof Error ? error.message : "Save failed" }); }
  }
  async function remove(item: BlogContent) {
    const confirmation = await Swal.fire({ icon: "warning", title: `Retire “${item.title}”?`, text: "The article will be unpublished, but its record and history will be preserved.", showCancelButton: true, confirmButtonText: "Retire article", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (confirmation.isConfirmed) { try { await retire(item.slug); void Swal.fire({ icon: "success", title: "Blog retired", timer: 1600, showConfirmButton: false }); } catch (error) { void Swal.fire({ icon: "error", text: error instanceof Error ? error.message : "Retirement failed" }); } }
  }
  async function duplicateArticle(item: BlogContent) {
    try {
      const copy = await duplicate(item.slug);
      void Swal.fire({ icon: "success", title: "Draft copy created", timer: 1400, showConfirmButton: false });
      router.push(`/caautobodyadmin/blogs/${copy.slug}`);
    } catch (error) { void Swal.fire({ icon: "error", text: error instanceof Error ? error.message : "Unable to duplicate article" }); }
  }

  return <>
    <div className="admin-page-head"><div><span>Content</span><h1>Blogs</h1><p>Manage article details, a featured image and flexible article body content.</p></div><button className="admin-primary" onClick={openNew}>+ New blog</button></div>
    <div className="admin-toolbar"><span>{items.length} articles · {lastSynced ? "Live sync active" : "Syncing"}</span><input placeholder="Search blogs" onChange={(event) => { const query = event.target.value.toLowerCase(); document.querySelectorAll<HTMLElement>("[data-blog-row]").forEach((row) => row.hidden = !row.dataset.search?.includes(query)); }} /><button onClick={() => void reload()}>Refresh CMS</button></div>
    {error ? <p className="admin-note" role="alert">CMS error: {error}</p> : null}
    {!ready ? <p className="admin-loading">Loading Supabase CMS…</p> : null}
    <section className="admin-panel"><div className="admin-table blogs"><div className="admin-table__row head"><span>Article</span><span>Category</span><span>Status</span><span>Date</span><span>Actions</span></div>{items.map((item) => <div data-blog-row data-search={`${item.title} ${item.category}`.toLowerCase()} className="admin-table__row" key={item.slug}><strong>{item.title}<small>/{item.slug}</small></strong><span>{item.category}</span><span><i className={`status-dot ${item.status}`} />{item.status}</span><span>{item.date}</span><span className="table-actions"><Link href={`/caautobodyadmin/blogs/${item.slug}`}>Edit article</Link><button onClick={() => openEdit(item)}>Details</button><button onClick={() => void duplicateArticle(item)}>Duplicate</button><button className="admin-danger" onClick={() => void remove(item)}>Retire</button></span></div>)}</div></section>
    {editing ? <AdminModal title={editing.slug ? "Article details" : "New blog"} onClose={() => setEditing(null)}><form className="admin-form" onSubmit={(event) => void submit(event)}><label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><div className="admin-form-row"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as BlogContent["category"] })}><option value="CA Knows">CA Knows</option><option value="Client Stories">Client Stories</option></select></label><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BlogContent["status"] })}><option value="draft">Draft</option><option value="published" disabled={role === "editor"}>Published</option></select></label></div><label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated-if-empty" /></label><CmsImageField id="blog-featured-image" label="Featured image" value={form.image} onChange={(image) => setForm({ ...form, image })} /><label>Excerpt<textarea rows={5} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></label><div className="admin-form-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className="admin-primary" type="submit">Save and edit body</button></div></form></AdminModal> : null}
  </>;
}

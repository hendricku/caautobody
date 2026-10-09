"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import AdminModal from "@/components/Admin/AdminModal";
import { useImportedBlogs } from "@/lib/useImportedBlogs";
import { defaultBlogBlocks, getBlogBlocks } from "@/lib/blogContent";
import type { BlogContent } from "@/types/content";

const blank: BlogContent = { slug: "", title: "", date: "", category: "CA Knows", excerpt: "", image: "", status: "draft" };

export default function AdminBlogs() {
  const { items, setItems, reset } = useImportedBlogs();
  const [editing, setEditing] = useState<BlogContent | null>(null);
  const [form, setForm] = useState<BlogContent>(blank);
  const openNew = () => { const next = { ...blank, date: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) }; setForm(next); setEditing(next); };
  const openEdit = (item: BlogContent) => { const next = { ...item, blocks: getBlogBlocks(item) }; setForm(next); setEditing(next); };
  const submit = (event: FormEvent) => { event.preventDefault(); const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); const next = { ...form, slug, origin: "local" as const, blocks: form.blocks?.length ? form.blocks : defaultBlogBlocks({ ...form, slug }) }; setItems((current) => editing?.slug ? current.map((item) => item.slug === editing.slug ? next : item) : [next, ...current]); setEditing(null); };
  async function remove(item: BlogContent) {
    const confirmation = await Swal.fire({ icon: "warning", title: `Delete “${item.title}”?`, text: "This local draft will be removed from this browser.", showCancelButton: true, confirmButtonText: "Delete blog", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (confirmation.isConfirmed) setItems((current) => current.filter((entry) => entry.slug !== item.slug));
  }

  return <>
    <div className="admin-page-head"><div><span>Content</span><h1>Blogs</h1><p>Manage article details, a featured image and flexible article body content.</p></div><button className="admin-primary" onClick={openNew}>+ New blog</button></div>
    <div className="admin-toolbar"><input placeholder="Search blogs" onChange={(event) => { const query = event.target.value.toLowerCase(); document.querySelectorAll<HTMLElement>("[data-blog-row]").forEach((row) => row.hidden = !row.dataset.search?.includes(query)); }} /><button onClick={reset}>Reset mock data</button></div>
    <section className="admin-panel"><div className="admin-table blogs"><div className="admin-table__row head"><span>Article</span><span>Category</span><span>Status</span><span>Date</span><span>Actions</span></div>{items.map((item) => <div data-blog-row data-search={`${item.title} ${item.category}`.toLowerCase()} className="admin-table__row" key={item.slug}><strong>{item.title}<small>/{item.slug}</small></strong><span>{item.category}</span><span><i className={`status-dot ${item.status}`} />{item.status}</span><span>{item.date}</span><span className="table-actions"><Link href={`/caautobodyadmin/blogs/${item.slug}`}>Edit article</Link><button onClick={() => openEdit(item)}>Details</button><button className="admin-danger" onClick={() => void remove(item)}>Delete</button></span></div>)}</div></section>
    {editing ? <AdminModal title={editing.slug ? "Article details" : "New blog"} onClose={() => setEditing(null)}><form className="admin-form" onSubmit={submit}><label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><div className="admin-form-row"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as BlogContent["category"] })}><option>CA Knows</option><option>Client Stories</option></select></label><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BlogContent["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></label></div><label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated-if-empty" /></label><label>Featured image URL<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label><label>Excerpt<textarea rows={5} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></label><div className="admin-form-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className="admin-primary" type="submit">Save and edit body</button></div></form></AdminModal> : null}
  </>;
}

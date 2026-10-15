"use client";

import { FormEvent, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AdminModal from "@/components/Admin/AdminModal";
import { useCmsCollection } from "@/lib/cms/useCmsCollection";
import { faqCategories } from "@/lib/siteContent";
import type { FAQContent } from "@/types/content";

const blank: FAQContent = { id: "", category: "General", question: "", answer: "", visible: true, status: "draft" };

export default function AdminFAQ() {
  const { items, save, retire, error, reload, role } = useCmsCollection<FAQContent>("faqs");
  const [editing, setEditing] = useState<FAQContent | null>(null);
  const [form, setForm] = useState(blank);
  const [filter, setFilter] = useState("All categories");
  const categories = useMemo(() => Array.from(new Set([...faqCategories, ...items.map((item) => item.category)])), [items]);
  const filtered = items.filter((item) => filter === "All categories" || item.category === filter);

  const edit = (item?: FAQContent) => {
    const value = item || { ...blank, id: `faq-${Date.now()}` };
    setEditing(value);
    setForm(value);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = { ...form, category: form.category.trim() || "General" };
    try { await save(next, editing?.question ? editing.id : undefined); setEditing(null); void Swal.fire({ icon: "success", title: editing?.question ? "FAQ updated" : "FAQ created", timer: 1700, showConfirmButton: false }); }
    catch (err) { void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Save failed" }); }
  };
  const remove = async (item: FAQContent) => {
    const confirmation = await Swal.fire({ icon: "warning", title: "Retire this FAQ?", text: "The question will be unpublished but retained for audit.", showCancelButton: true, confirmButtonText: "Retire FAQ", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (confirmation.isConfirmed) { try { await retire(item.id); void Swal.fire({ icon: "success", title: "FAQ retired", timer: 1600, showConfirmButton: false }); } catch (err) { void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Retirement failed" }); } }
  };

  return <>
    <div className="admin-page-head"><div><span>Helpful content</span><h1>FAQ library</h1><p>Manage the category-based questions displayed on the public FAQ page.</p></div><button className="admin-primary" onClick={() => edit()}>+ Add FAQ</button></div>
    <div className="admin-toolbar admin-faq-toolbar"><span>{items.filter((item) => item.visible).length} visible FAQs</span><label>Category<select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><button onClick={() => void reload()}>Refresh CMS</button></div>
    <div className="admin-faq-categories" aria-label="FAQ category counts">{categories.map((category) => <button key={category} className={filter === category ? "is-active" : ""} onClick={() => setFilter(category)}>{category}<span>{items.filter((item) => item.category === category).length}</span></button>)}</div>
    {error ? <p role="alert" className="admin-note">CMS error: {error}</p> : null}
    <section className="admin-panel"><div className="admin-table faq"><div className="admin-table__row head"><span>Question</span><span>Category</span><span>Visibility</span><span>Actions</span></div>{filtered.map((item) => <div className="admin-table__row" key={item.id}><strong>{item.question}<small>{item.answer}</small></strong><span>{item.category}</span><span>{item.visible ? "Visible" : "Hidden"}</span><span className="table-actions"><button onClick={() => edit(item)}>Edit</button><button className="admin-danger" onClick={() => void remove(item)}>Delete</button></span></div>)}</div></section>
    {editing ? <AdminModal title={editing.question ? "Edit FAQ" : "New FAQ"} onClose={() => setEditing(null)}><form className="admin-form" onSubmit={(event) => void submit(event)}><label>Question<input required value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} /></label><label>Answer<textarea rows={6} required value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} /></label><div className="admin-form-row"><label>Category<input required list="faq-category-options" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /><datalist id="faq-category-options">{categories.map((category) => <option key={category} value={category} />)}</datalist></label><label className="check-label"><input type="checkbox" checked={form.visible} onChange={(event) => setForm({ ...form, visible: event.target.checked })} />Visible on website</label></div><label>Publication status<select value={form.status || "draft"} onChange={event=>setForm({...form,status:event.target.value as FAQContent["status"]})}><option value="draft">Draft</option><option value="published" disabled={role==="editor"}>Published</option></select></label><div className="admin-form-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className="admin-primary" type="submit">Save FAQ</button></div></form></AdminModal> : null}
  </>;
}

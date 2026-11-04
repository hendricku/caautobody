"use client";

import { useRef } from "react";
import CmsImageField from "@/components/Admin/CmsImageField";
import type { OfferSection } from "@/types/content";

const labels: Record<OfferSection["type"], string> = { editorial: "Editorial section", steps: "Numbered steps", faq: "Questions and answers", cta: "Call to action" };
const create = (type: OfferSection["type"]): OfferSection => ({ id: crypto.randomUUID(), type, title: type === "faq" ? "Answers before you book" : type === "cta" ? "Ready to get started?" : "New section", copy: "", items: type === "steps" || type === "faq" ? [{ title: "New item", copy: "" }] : [] });

export default function OfferSectionBuilder({ value, onChange }: { value: OfferSection[]; onChange: (sections: OfferSection[]) => void }) {
  const dragged = useRef<number | null>(null);
  const update = (index: number, patch: Partial<OfferSection>) => onChange(value.map((section, current) => current === index ? { ...section, ...patch } : section));
  const remove = (index: number) => onChange(value.filter((_, current) => current !== index));
  const move = (from: number, to: number) => { if (to < 0 || to >= value.length || from === to) return; const next = [...value]; const [section] = next.splice(from, 1); next.splice(to, 0, section); onChange(next); };
  const updateItem = (sectionIndex: number, itemIndex: number, patch: { title?: string; copy?: string }) => update(sectionIndex, { items: (value[sectionIndex].items || []).map((item, current) => current === itemIndex ? { ...item, ...patch } : item) });
  return <section className="admin-editor__fieldset offer-builder"><div className="offer-builder__head"><div><h2 className="admin-editor__section-title">Page sections</h2><p>Build the page from approved blocks. Drag to change the public reading order.</p></div><div className="offer-builder__add">{(Object.keys(labels) as OfferSection["type"][]).map((type) => <button key={type} type="button" onClick={() => onChange([...value, create(type)])}>+ {labels[type]}</button>)}</div></div>
    {!value.length ? <div className="admin-empty"><strong>No optional sections yet.</strong><p>The professional hero, assessment form and closing contact panel are always included. Add a section above to extend this offer.</p></div> : <div className="admin-blocks">{value.map((section, index) => <article className="admin-block" key={section.id} draggable onDragStart={() => { dragged.current = index; }} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged.current !== null) move(dragged.current, index); dragged.current = null; }}>
      <header className="admin-block__bar"><span>{labels[section.type]}</span><div className="admin-block__actions"><button className="admin-drag-handle" type="button" aria-label={`Move ${section.title} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>↑</button><button className="admin-drag-handle" type="button" aria-label={`Move ${section.title} down`} disabled={index === value.length - 1} onClick={() => move(index, index + 1)}>↓</button><button type="button" aria-label={`Remove ${section.title}`} onClick={() => remove(index)}>×</button></div></header>
      <div className="admin-block__body"><label>Section label<input value={section.eyebrow || ""} onChange={(event) => update(index, { eyebrow: event.target.value })} /></label><label>Heading<input value={section.title} onChange={(event) => update(index, { title: event.target.value })} /></label><label>{section.type === "faq" ? "Introduction" : "Copy"}<textarea value={section.copy || ""} onChange={(event) => update(index, { copy: event.target.value })} /></label>
        {section.type === "editorial" ? <><CmsImageField id={`offer-section-${section.id}`} label="Section image" purpose="featured" value={section.image || ""} onChange={(image) => update(index, { image })} /><label>Image description<input value={section.imageAlt || ""} onChange={(event) => update(index, { imageAlt: event.target.value })} /></label></> : null}
        {(section.type === "steps" || section.type === "faq") ? <div className="offer-builder__items">{(section.items || []).map((item, itemIndex) => <div key={`${section.id}-${itemIndex}`}><label>{section.type === "faq" ? "Question" : "Step title"}<input value={item.title} onChange={(event) => updateItem(index, itemIndex, { title: event.target.value })} /></label><label>{section.type === "faq" ? "Answer" : "Step detail"}<textarea value={item.copy} onChange={(event) => updateItem(index, itemIndex, { copy: event.target.value })} /></label><button type="button" onClick={() => update(index, { items: (section.items || []).filter((_, current) => current !== itemIndex) })}>Remove item</button></div>)}<button type="button" onClick={() => update(index, { items: [...(section.items || []), { title: "New item", copy: "" }] })}>+ Add item</button></div> : null}
      </div>
    </article>)}</div>}
  </section>;
}

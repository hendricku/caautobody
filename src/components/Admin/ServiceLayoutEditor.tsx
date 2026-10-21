"use client";

import type { DragEvent } from "react";
import CmsImageField from "@/components/Admin/CmsImageField";
import type { BrandRepairContent } from "@/lib/brandRepairContent";
import type { OriginalServicePage } from "@/lib/originalServiceCopy";
import type { ServicePresentation } from "@/lib/cms/public-content";

type TextCard = Record<string, string>;
type Block = { type: "paragraph" | "subheading" | "bullet"; text: string };
type EditorialSection = { heading: string; blocks: Block[] };

const text = (value: unknown) => typeof value === "string" ? value : "";
const strings = (value: unknown) => Array.isArray(value) ? value.map(text) : [];
/** Reorder presentation arrays only; serialization and persistence stay unchanged. */
function moved<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const next = [...items]; const [picked] = next.splice(from, 1); next.splice(to, 0, picked); return next;
}
function dragStart(event: DragEvent, scope: string, index: number) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", `${scope}:${index}`);
}
function dragDrop(event: DragEvent, scope: string, target: number, length: number, reorder: (from: number, to: number) => void) {
  event.preventDefault();
  const source = event.dataTransfer.getData("text/plain");
  if (!source.startsWith(`${scope}:`)) return;
  const index = Number(source.slice(scope.length + 1));
  if (Number.isInteger(index) && index >= 0 && index < length) reorder(index, target);
}
const cards = (value: unknown, keys: string[]): TextCard[] => Array.isArray(value) ? value.map((item) => {
  const source = item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {};
  return Object.fromEntries(keys.map((key) => [key, text(source[key])])) as TextCard;
}) : [];

function emptyEditorial(): OriginalServicePage {
  return { slug: "", category: "Service", url: "", title: "", introParagraphs: [], brandMarks: [], sections: [], faqHeading: null, faqIntro: [], faqs: [] };
}

function emptyBrand(): BrandRepairContent {
  return {
    brand: "BYD", seoDescription: "", eyebrow: "", title: "", intro: "", heroImage: "", heroAlt: "", logo: "", assessmentCta: "Enquire about a repair", contactCta: "Contact CA Autobody", serviceGuide: [], approvalPoints: [], approvalTitle: "", approvalCopy: "", pillars: [], principles: [], capabilities: [], systemsTitle: "", systemsCopy: "", process: [], supportTitle: "", supportCopy: "", supportPoints: [], disclaimer: "", faqs: [], review: { rating: "", quote: "", author: "" }, media: [], sections: { assessmentEyebrow: "", assessmentTitle: "", assessmentNote: "", approvalEyebrow: "", principlesEyebrow: "", principlesTitle: "", capabilityEyebrow: "", capabilityTitle: "", capabilityIntro: "", systemsEyebrow: "", journeyEyebrow: "", journeyTitle: "", journeyIntro: "", supportEyebrow: "", faqEyebrow: "", faqTitle: "", reviewEyebrow: "", reviewTitle: "", finalEyebrow: "", finalTitle: "", finalCopy: "" },
  };
}

function TextList({ label, value, onChange, addLabel = "Add item" }: { label: string; value: string[]; onChange: (value: string[]) => void; addLabel?: string }) {
  const update = (index: number, next: string) => onChange(value.map((item, itemIndex) => itemIndex === index ? next : item));
  const move = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= value.length) return;
    onChange(moved(value, index, destination));
  };
  return <fieldset className="admin-layout-fieldset"><legend>{label}</legend><div className="admin-repeat-list">
    {value.map((item, index) => <div className="admin-repeat-row" key={index} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dragDrop(event, `text-${label}`, index, value.length, (from, to) => onChange(moved(value, from, to)))}><textarea aria-label={`${label} ${index + 1}`} rows={2} value={item} onChange={(event) => update(index, event.target.value)} /><div><button type="button" className="admin-drag-handle" draggable title="Drag to reorder" aria-label={`Drag ${label} ${index + 1} to reorder`} onDragStart={(event) => dragStart(event, `text-${label}`, index)}>⠿</button><button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="admin-reorder-keyboard" aria-label={`Move ${label} ${index + 1} up`}>↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} className="admin-reorder-keyboard" aria-label={`Move ${label} ${index + 1} down`}>↓</button><button type="button" className="admin-danger" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div></div>)}
    <button type="button" className="admin-add-row" onClick={() => onChange([...value, ""])}>+ {addLabel}</button>
  </div></fieldset>;
}

function CardList({ label, value, keys, onChange, imageKey }: { label: string; value: TextCard[]; keys: string[]; onChange: (value: TextCard[]) => void; imageKey?: string }) {
  const update = (index: number, patch: TextCard) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const move = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= value.length) return; onChange(moved(value, index, target)); };
  return <fieldset className="admin-layout-fieldset"><legend>{label}</legend><div className="admin-layout-cards">
    {value.map((item, index) => <section className="admin-layout-card" key={index} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dragDrop(event, `card-${label}`, index, value.length, (from, to) => onChange(moved(value, from, to)))}><div className="admin-layout-card__head"><strong>{label.slice(0, -1) || "Item"} {index + 1}</strong><span><button type="button" className="admin-drag-handle" draggable title="Drag to reorder" aria-label={`Drag ${label} ${index + 1} to reorder`} onDragStart={(event) => dragStart(event, `card-${label}`, index)}>⠿</button><button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="admin-reorder-keyboard" aria-label={`Move ${label} ${index + 1} up`}>↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} className="admin-reorder-keyboard" aria-label={`Move ${label} ${index + 1} down`}>↓</button><button type="button" className="admin-danger" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></span></div>
      {keys.map((key) => imageKey === key ? <CmsImageField key={key} id={`${label}-${index}-${key}`} label={key === "image" ? "Image" : key} purpose="content" value={item[key]} onChange={(image) => update(index, { [key]: image })} /> : <label key={key}>{key.replace(/([A-Z])/g, " $1")}<textarea rows={key === "copy" || key === "answer" || key === "alt" ? 3 : 1} value={item[key]} onChange={(event) => update(index, { [key]: event.target.value })} /></label>)}
    </section>)}
    <button type="button" className="admin-add-row" onClick={() => onChange([...value, Object.fromEntries(keys.map((key) => [key, ""]))])}>+ Add {label.slice(0, -1) || "item"}</button>
  </div></fieldset>;
}

function EditorialLayout({ value, onChange }: { value: OriginalServicePage; onChange: (value: OriginalServicePage) => void }) {
  const update = (patch: Partial<OriginalServicePage>) => onChange({ ...value, ...patch });
  const sections: EditorialSection[] = (value.sections || []).map((section): EditorialSection => ({ heading: text(section.heading), blocks: Array.isArray(section.blocks) ? section.blocks.map((block): Block => ({ type: block.type === "subheading" || block.type === "bullet" ? block.type : "paragraph", text: text(block.text) })) : [] }));
  const setSections = (next: EditorialSection[]) => update({ sections: next });
  const changeSection = (index: number, patch: Partial<EditorialSection>) => setSections(sections.map((section, itemIndex) => itemIndex === index ? { ...section, ...patch } : section));
  return <div className="admin-layout-editor"><p className="admin-layout-editor__intro">Build the page in the same order visitors read it. Each section can contain normal paragraphs, a heading, or bullet points.</p>
    <fieldset className="admin-layout-fieldset"><legend>Page introduction</legend><div className="admin-form-row"><label>Service category<input value={value.category} onChange={(event) => update({ category: event.target.value })} /></label><label>Page headline<input value={value.title} onChange={(event) => update({ title: event.target.value })} /></label></div><label>Search description<textarea rows={3} value={value.seoDescription || ""} onChange={(event) => update({ seoDescription: event.target.value })} /></label><label>Hero summary<textarea rows={3} value={value.heroDescription || ""} onChange={(event) => update({ heroDescription: event.target.value })} /></label></fieldset>
    <TextList label="Opening paragraphs" value={strings(value.introParagraphs)} onChange={(introParagraphs) => update({ introParagraphs })} addLabel="Add paragraph" />
    <TextList label="Brand marks or approval labels" value={strings(value.brandMarks)} onChange={(brandMarks) => update({ brandMarks })} addLabel="Add label" />
    <fieldset className="admin-layout-fieldset"><legend>Page sections</legend><div className="admin-layout-cards">{sections.map((section, sectionIndex) => <section className="admin-layout-card" key={sectionIndex} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dragDrop(event, "editorial-sections", sectionIndex, sections.length, (from, to) => setSections(moved(sections, from, to)))}><div className="admin-layout-card__head"><strong>Section {sectionIndex + 1}</strong><span><button type="button" draggable className="admin-drag-handle" aria-label={`Drag section ${sectionIndex + 1} to reorder`} title="Drag to reorder" onDragStart={(event) => dragStart(event, "editorial-sections", sectionIndex)}>⠿</button><button type="button" disabled={sectionIndex === 0} className="admin-reorder-keyboard" aria-label={`Move section ${sectionIndex + 1} up`} onClick={() => setSections(moved(sections, sectionIndex, sectionIndex - 1))}>↑</button><button type="button" disabled={sectionIndex === sections.length - 1} className="admin-reorder-keyboard" aria-label={`Move section ${sectionIndex + 1} down`} onClick={() => setSections(moved(sections, sectionIndex, sectionIndex + 1))}>↓</button><button type="button" className="admin-danger" onClick={() => setSections(sections.filter((_, index) => index !== sectionIndex))}>Delete section</button></span></div><label>Section heading<input value={section.heading} onChange={(event) => changeSection(sectionIndex, { heading: event.target.value })} /></label><div className="admin-section-blocks">{section.blocks.map((block, blockIndex) => <div className="admin-section-block" key={blockIndex} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dragDrop(event, `editorial-block-${sectionIndex}`, blockIndex, section.blocks.length, (from, to) => changeSection(sectionIndex, { blocks: moved(section.blocks, from, to) }))}><button type="button" draggable className="admin-drag-handle" title="Drag to reorder" aria-label={`Drag content block ${blockIndex + 1} to reorder`} onDragStart={(event) => dragStart(event, `editorial-block-${sectionIndex}`, blockIndex)}>⠿</button><select aria-label={`Section ${sectionIndex + 1} content type`} value={block.type} onChange={(event) => { const type = event.target.value as Block["type"]; changeSection(sectionIndex, { blocks: section.blocks.map((item, index) => index === blockIndex ? { ...item, type } : item) }); }}><option value="paragraph">Paragraph</option><option value="subheading">Heading</option><option value="bullet">Bullet point</option></select><textarea aria-label={`Section ${sectionIndex + 1} content ${blockIndex + 1}`} rows={3} value={block.text} onChange={(event) => changeSection(sectionIndex, { blocks: section.blocks.map((item, index) => index === blockIndex ? { ...item, text: event.target.value } : item) })} /><button type="button" className="admin-danger" onClick={() => changeSection(sectionIndex, { blocks: section.blocks.filter((_, index) => index !== blockIndex) })}>Delete</button></div>)}<button type="button" className="admin-add-row" onClick={() => changeSection(sectionIndex, { blocks: [...section.blocks, { type: "paragraph", text: "" }] })}>+ Add content</button></div></section>)}<button type="button" className="admin-add-row" onClick={() => setSections([...sections, { heading: "", blocks: [{ type: "paragraph", text: "" }] }])}>+ Add section</button></div></fieldset>
    <fieldset className="admin-layout-fieldset"><legend>Contact and FAQs</legend><div className="admin-form-row"><label>Contact heading<input value={value.contactHeading || ""} onChange={(event) => update({ contactHeading: event.target.value })} /></label><label>FAQ heading<input value={value.faqHeading || ""} onChange={(event) => update({ faqHeading: event.target.value || null })} /></label></div><label>Contact copy<textarea rows={3} value={value.contactCopy || ""} onChange={(event) => update({ contactCopy: event.target.value })} /></label><label>Disclaimer<textarea rows={3} value={value.disclaimer || ""} onChange={(event) => update({ disclaimer: event.target.value })} /></label></fieldset>
    <TextList label="FAQ introduction paragraphs" value={strings(value.faqIntro)} onChange={(faqIntro) => update({ faqIntro })} addLabel="Add paragraph" />
    <CardList label="FAQs" keys={["question", "answer"]} value={cards(value.faqs, ["question", "answer"])} onChange={(faqs) => update({ faqs: faqs as unknown as OriginalServicePage["faqs"] })} />
  </div>;
}

function BrandLayout({ value, onChange }: { value: BrandRepairContent; onChange: (value: BrandRepairContent) => void }) {
  const update = (patch: Partial<BrandRepairContent>) => onChange({ ...value, ...patch });
  const updateSections = (key: keyof BrandRepairContent["sections"], next: string) => update({ sections: { ...value.sections, [key]: next } });
  const sectionFields = Object.keys(value.sections) as Array<keyof BrandRepairContent["sections"]>;
  return <div className="admin-layout-editor"><p className="admin-layout-editor__intro">Use the named sections below to edit the live brand page without seeing technical code. Add cards only when the page needs them.</p>
    <fieldset className="admin-layout-fieldset"><legend>Brand page setup</legend><div className="admin-form-row"><label>Brand<select value={value.brand} onChange={(event) => update({ brand: event.target.value === "Lexus" ? "Lexus" : "BYD" })}><option>BYD</option><option>Lexus</option></select></label><label>Hero eyebrow<input value={value.eyebrow} onChange={(event) => update({ eyebrow: event.target.value })} /></label></div><label>Page headline<input value={value.title} onChange={(event) => update({ title: event.target.value })} /></label><label>Search description<textarea rows={3} value={value.seoDescription} onChange={(event) => update({ seoDescription: event.target.value })} /></label><label>Hero introduction<textarea rows={4} value={value.intro} onChange={(event) => update({ intro: event.target.value })} /></label><p className="admin-layout-editor__intro">Manage the Hero Background and Right-Side Image in their separate panels beneath Page Settings. Your existing hero image remains attached when editing this layout.</p><label>Hero image description<input value={value.heroAlt} onChange={(event) => update({ heroAlt: event.target.value })} /></label><CmsImageField id="brand-layout-logo" label="Brand logo" purpose="logo" value={value.logo} onChange={(logo) => update({ logo })} /></fieldset>
    <TextList label="Service guide links" value={strings(value.serviceGuide)} onChange={(serviceGuide) => update({ serviceGuide })} addLabel="Add guide item" />
    <TextList label="Approval points" value={strings(value.approvalPoints)} onChange={(approvalPoints) => update({ approvalPoints })} addLabel="Add approval point" />
    <fieldset className="admin-layout-fieldset"><legend>Approval and systems</legend><label>Approval title<input value={value.approvalTitle} onChange={(event) => update({ approvalTitle: event.target.value })} /></label><label>Approval copy<textarea rows={4} value={value.approvalCopy} onChange={(event) => update({ approvalCopy: event.target.value })} /></label><label>Systems title<input value={value.systemsTitle} onChange={(event) => update({ systemsTitle: event.target.value })} /></label><label>Systems copy<textarea rows={4} value={value.systemsCopy} onChange={(event) => update({ systemsCopy: event.target.value })} /></label></fieldset>
    <CardList label="Pillars" keys={["code", "title", "copy"]} value={cards(value.pillars, ["code", "title", "copy"])} onChange={(pillars) => update({ pillars: pillars as unknown as BrandRepairContent["pillars"] })} />
    <CardList label="Principles" keys={["title", "copy"]} value={cards(value.principles, ["title", "copy"])} onChange={(principles) => update({ principles: principles as unknown as BrandRepairContent["principles"] })} />
    <CardList label="Capabilities" keys={["title", "copy"]} value={cards(value.capabilities, ["title", "copy"])} onChange={(capabilities) => update({ capabilities: capabilities as unknown as BrandRepairContent["capabilities"] })} />
    <CardList label="Repair process steps" keys={["title", "copy"]} value={cards(value.process, ["title", "copy"])} onChange={(process) => update({ process: process as unknown as BrandRepairContent["process"] })} />
    <fieldset className="admin-layout-fieldset"><legend>Support and calls to action</legend><div className="admin-form-row"><label>Assessment button<input value={value.assessmentCta} onChange={(event) => update({ assessmentCta: event.target.value })} /></label><label>Contact button<input value={value.contactCta} onChange={(event) => update({ contactCta: event.target.value })} /></label></div><label>Support title<input value={value.supportTitle} onChange={(event) => update({ supportTitle: event.target.value })} /></label><label>Support copy<textarea rows={4} value={value.supportCopy} onChange={(event) => update({ supportCopy: event.target.value })} /></label><label>Important notice<textarea rows={4} value={value.disclaimer} onChange={(event) => update({ disclaimer: event.target.value })} /></label></fieldset>
    <TextList label="Support points" value={strings(value.supportPoints)} onChange={(supportPoints) => update({ supportPoints })} addLabel="Add support point" />
    <CardList label="FAQs" keys={["question", "answer"]} value={cards(value.faqs, ["question", "answer"])} onChange={(faqs) => update({ faqs: faqs as unknown as BrandRepairContent["faqs"] })} />
    <CardList label="Customer review" keys={["rating", "quote", "author"]} value={[value.review]} onChange={(review) => update({ review: (review[0] || { rating: "", quote: "", author: "" }) as BrandRepairContent["review"] })} />
    <CardList label="Supporting images" keys={["image", "alt", "label"]} imageKey="image" value={cards(value.media, ["image", "alt", "label"])} onChange={(media) => update({ media: media as unknown as BrandRepairContent["media"] })} />
    <fieldset className="admin-layout-fieldset"><legend>Section headings and supporting copy</legend><div className="admin-form-row">{sectionFields.map((key) => <label key={key}>{key.replace(/([A-Z])/g, " $1")}<textarea rows={key.endsWith("Intro") || key.endsWith("Copy") || key.endsWith("Note") ? 3 : 1} value={value.sections[key]} onChange={(event) => updateSections(key, event.target.value)} /></label>)}</div></fieldset>
  </div>;
}

export default function ServiceLayoutEditor({ value, onChange }: { value: ServicePresentation; onChange: (value: ServicePresentation) => void }) {
  const variant = value.variant;
  const chooseVariant = (next: ServicePresentation["variant"]) => {
    if (next === variant) return;
    if (variant !== "standard" && !window.confirm("Changing the page layout replaces the unsaved layout fields in this editor. Continue?")) return;
    if (next === "standard") onChange({ variant: "standard" });
    else if (next === "editorial") onChange({ variant: "editorial", data: emptyEditorial() });
    else onChange({ variant: "brand", data: emptyBrand() });
  };
  return <section className="admin-layout-builder" aria-labelledby="service-layout-heading"><div className="admin-layout-builder__head"><div><h2 id="service-layout-heading">Page layout and content</h2><p>Choose the page type, then edit the visible website content in plain language.</p></div><label>Layout type<select value={variant} onChange={(event) => chooseVariant(event.target.value as ServicePresentation["variant"])}><option value="standard">Standard service page</option><option value="editorial">Editorial service page</option><option value="brand">Brand repair page</option></select></label></div>
    {variant === "standard" ? <p className="admin-layout-builder__empty">This page uses the standard service layout. Its title, image, introduction, paragraphs and highlights are edited in the fields above.</p> : null}
    {variant === "editorial" ? <EditorialLayout value={value.data} onChange={(data) => onChange({ variant: "editorial", data: { ...value.data, ...data } })} /> : null}
    {variant === "brand" ? <BrandLayout value={value.data} onChange={(data) => onChange({ variant: "brand", data: { ...value.data, ...data } })} /> : null}
  </section>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { FAQContent } from "@/types/content";
import { originalServiceCopy } from "@/lib/originalServiceCopy";

// Merged local FAQ data may contain legacy copies with different IDs.
// The client's original DOCX entry always wins without altering its wording.
function uniqueVisibleFAQs(items: FAQContent[]): FAQContent[] {
  const seen = new Set<string>();
  return [...items]
    .filter((item) => item.visible)
    .sort((a, b) => Number(b.id.startsWith("original-")) - Number(a.id.startsWith("original-")))
    .filter((item) => {
      const key = `${item.category.toLowerCase().trim()}::${item.question.toLowerCase().trim().replace(/\s+/g, " ")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function Answer({ value }: { value: string }) {
  const parts = value.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return <>{parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    return match ? <a key={part} href={match[2]}>{match[1]}</a> : <span key={`${part}-${index}`}>{part}</span>;
  })}</>;
}

export default function FAQList({ items }: { items: FAQContent[] }) {
  const visibleItems = useMemo(() => uniqueVisibleFAQs(items), [items]);
  const categories = useMemo(() => Array.from(new Set(visibleItems.map((item) => item.category))), [visibleItems]);
  const [category, setCategory] = useState(categories[0] ?? "General");
  const [openId, setOpenId] = useState<string | null>(null);

  // Service page FAQ links deep-link to the correct source category.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("category");
    if (requested && categories.includes(requested)) setCategory(requested);
  }, [categories]);

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0] ?? "General");
      setOpenId(null);
    }
  }, [categories, category]);

  const questions = visibleItems.filter((item) => item.category === category);
  const originalService = Object.values(originalServiceCopy).find((service) => service.category === category);
  const originalFaqIntro = originalService?.faqIntro ?? [];
  const count = (item: string) => visibleItems.filter((faq) => faq.category === item).length;

  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setOpenId(null);
  };

  const accordion = (entries: FAQContent[]) => <div className="faq-accordion__items">
    {entries.map((item) => {
      const isOpen = openId === item.id;
      const panelId = `${item.id}-answer`;
      return <article className={isOpen ? "is-open" : ""} key={item.id}>
        <h3><button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpenId(isOpen ? null : item.id)}><span>{item.question}</span><b aria-hidden="true">{isOpen ? "\u2212" : "+"}</b></button></h3>
        <div id={panelId} role="region" aria-label={item.question} hidden={!isOpen}><p><Answer value={item.answer} /></p></div>
      </article>;
    })}
  </div>;

  return <div className="faq-accordion">
    <div className="faq-topic-picker">
      <nav className="faq-topic-index" aria-label="FAQ topics"><p>Browse topics</p>{categories.map((item) => <button type="button" key={item} aria-pressed={category === item} className={category === item ? "is-active" : ""} onClick={() => selectCategory(item)}><span>{item}</span><small>{count(item)}</small></button>)}</nav>
      <label className="faq-topic-select"><span>Browse topics</span><select value={category} onChange={(event) => selectCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item} ({count(item)})</option>)}</select></label>
      <section className="faq-accordion__panel" aria-labelledby="faq-category-title">
        <div className="faq-accordion__heading"><p className="eyebrow">Explore by service</p><h2 id="faq-category-title">{category}</h2>{originalService?.faqHeading ? <span className="ca-visually-hidden">{originalService.faqHeading}</span> : null}{originalFaqIntro.map((paragraph, index) => <p className="faq-accordion__original-intro" key={index}>{paragraph}</p>)}</div>
        {accordion(questions)}
      </section>
    </div>
  </div>;
}

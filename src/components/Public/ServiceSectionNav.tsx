"use client";

import { useEffect, useState, type MouseEvent } from "react";

export type SectionNavigationItem = {
  id: string;
  label: string;
  number: string;
};

/** All destinations are DOM IDs on the current service page, never Next.js routes. */
export default function ServiceSectionNav({ items }: { items: SectionNavigationItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets = items.map(({ id }) => document.getElementById(id)).filter((item): item is HTMLElement => Boolean(item));
    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.filter((entry) => entry.isIntersecting);
      if (!intersecting.length) return;
      intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      setActiveId(intersecting[0].target.id);
    }, { rootMargin: "-115px 0px -55% 0px", threshold: 0 });
    targets.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [items]);

  function goToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return; // Native hash remains the progressive enhancement fallback.
    event.preventDefault();
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    window.history.replaceState(window.history.state, "", `#${encodeURIComponent(id)}`);
    setActiveId(id);
  }

  return <nav className="ca-service__index-links" aria-label="Jump to a section on this page">
    <span>On this page</span>
    {items.map(({ id, label, number }) => <a key={id} href={`#${id}`} onClick={(event) => goToSection(event, id)} className={activeId === id ? "is-current" : undefined} aria-current={activeId === id ? "location" : undefined}>
      <span>{number}</span><span>{label}</span>
    </a>)}
  </nav>;
}

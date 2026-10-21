"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { announceCmsChange } from "@/lib/cms/cms-sync";

type Area = "menu" | "slider";
type Service = { slug: string; title: string; menu: boolean; slider: boolean };
type Payload = { services: Service[]; menu: string[]; slider: string[]; availableMenu: string[]; availableSlider: string[]; revision: string | null; role: string };
const titles: Record<Area, string> = { menu: "Services Mega Menu", slider: "Homepage Services Slider" };

export default function MenuArrangementPage() {
  const [area, setArea] = useState<Area>("menu");
  const [initial, setInitial] = useState<Payload | null>(null);
  const [order, setOrder] = useState<Record<Area, string[]>>({ menu: [], slider: [] });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dragged = useRef<string | null>(null);
  const active = order[area];
  const editable = initial?.role === "admin" || initial?.role === "publisher";
  const available = area === "menu" ? initial?.availableMenu || [] : initial?.availableSlider || [];
  const dirty = Boolean(initial && (JSON.stringify(order.menu) !== JSON.stringify(initial.menu) || JSON.stringify(order.slider) !== JSON.stringify(initial.slider)));

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/service-arrangement", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load arrangement");
      setInitial(payload as Payload);
      setOrder({ menu: payload.menu, slider: payload.slider });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load arrangement"); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function move(slug: string, before: string | null) {
    if (!editable || (before === slug)) return;
    setNotice("");
    setOrder((previous) => {
      const items = [...previous[area]];
      const from = items.indexOf(slug);
      if (from < 0) return previous;
      items.splice(from, 1);
      const at = before ? items.indexOf(before) : items.length;
      items.splice(at < 0 ? items.length : at, 0, slug);
      return { ...previous, [area]: items };
    });
  }
  function toggle(slug: string) {
    setNotice("");
    setOrder((previous) => ({ ...previous, [area]: previous[area].includes(slug) ? previous[area].filter((id) => id !== slug) : [...previous[area], slug] }));
  }
  async function save() {
    if (!initial || !dirty || !editable) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/service-arrangement", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...order, revision: initial.revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save menu order");
      setInitial({ ...initial, ...order, revision: result.revision });
      announceCmsChange("service-arrangement");
      setNotice("Published arrangement saved. Open website tabs refresh automatically when the publication signal arrives.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Save failed"); }
    finally { setBusy(false); }
  }
  const name = (slug: string) => initial?.services.find((service) => service.slug === slug)?.title || slug;

  return <div className="admin-arrangement">
    <header className="admin-arrangement__head">
      <div><p className="admin-arrangement__eyebrow">CONTENT / WEBSITE NAVIGATION</p><h1>Menu Arrangement</h1><p>Arrange which published services appear first in the website navigation and homepage slider. Each order is independent.</p></div>
      <div className="admin-arrangement__actions"><Link href="/" target="_blank" rel="noopener noreferrer" className="admin-editor__secondary">View website ↗</Link><button type="button" disabled={!editable || !dirty || busy} onClick={() => void save()} className="admin-primary">{busy ? "Saving…" : "Save arrangement"}</button></div>
    </header>
    {dirty ? <p className="admin-arrangement__unsaved" role="status">Unsaved ordering changes</p> : null}
    {error ? <p className="admin-note" role="alert">{error}</p> : null}
    {notice ? <p className="admin-note" role="status">{notice}</p> : null}
    <div className="admin-arrangement__tabs" role="tablist" aria-label="Arrange website sections">
      {(["menu", "slider"] as const).map((tab) => <button type="button" key={tab} role="tab" aria-selected={area === tab} className={area === tab ? "active" : ""} onClick={() => setArea(tab)}>{titles[tab]}</button>)}
    </div>
    <section className="admin-arrangement__panel" aria-label={titles[area]}>
      <div className="admin-arrangement__section-head"><div><h2>{titles[area]}</h2><p>Drag a row by the handle, use Alt + ↑ / ↓ when focused, or select a new position on touch devices.</p></div><span>{active.length} visible / {available.length} available</span></div>
      {!initial ? <p>Loading published services…</p> : <>
        <ol className="admin-arrangement__list">
          {active.map((slug, index) => <li key={slug} className="admin-arrangement__row" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (dragged.current) move(dragged.current, slug); dragged.current = null; }}>
            <button type="button" aria-label={`Drag or use Alt and arrow keys to reorder ${name(slug)}`} className="admin-arrangement__handle" draggable={editable}
              onDragStart={(event) => { dragged.current = slug; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", slug); }}
              onDragEnd={() => { dragged.current = null; }}
              onKeyDown={(event) => { if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return; event.preventDefault(); const target = index + (event.key === "ArrowUp" ? -1 : 1); if (target < 0 || target >= active.length) return; move(slug, event.key === "ArrowUp" ? active[target] : active[target + 1] || null); }} disabled={!editable}>⠿</button>
            <span className="admin-arrangement__index">{String(index + 1).padStart(2, "0")}</span>
            <span className="admin-arrangement__name"><strong>{name(slug)}</strong><small>{slug === "prestige-brands" ? "Links to all services" : `/services/${slug}`}</small></span>
            {editable ? <label className="admin-arrangement__position">Position <select aria-label={`Move ${name(slug)} to position`} value={index + 1} onChange={(event) => { const position = Number(event.target.value) - 1; const other = active.filter((id) => id !== slug); move(slug, other[position] || null); }}>
              {active.map((_, number) => <option key={number} value={number + 1}>{number + 1}</option>)}
            </select></label> : null}
            {editable ? <button type="button" className="admin-arrangement__remove" onClick={() => toggle(slug)} aria-label={`Hide ${name(slug)} from ${titles[area]}`}>Hide</button> : null}
          </li>)}
        </ol>
        {active.length === 0 ? <p className="admin-arrangement__empty">No services selected for this section.</p> : null}
        <div className="admin-arrangement__available"><h3>Available to add</h3><p>Only published services enabled for this location can be added. Enable a service in its editor&apos;s Page Settings first.</p>
          <div className="admin-arrangement__chips">{available.filter((slug) => !active.includes(slug)).map((slug) => <button key={slug} type="button" disabled={!editable} onClick={() => toggle(slug)}>+ {name(slug)}</button>)}
          {available.every((slug) => active.includes(slug)) ? <small>All eligible services are included.</small> : null}</div>
        </div>
      </>}
    </section>
    {initial ? <footer className="admin-arrangement__foot"><button type="button" className="admin-editor__secondary" onClick={() => { setOrder({ menu: [...initial.menu], slider: [...initial.slider] }); setNotice(""); }}>Discard changes</button><button className="admin-primary" type="button" disabled={!editable || !dirty || busy} onClick={() => void save()}>Save arrangement</button></footer> : null}
  </div>;
}

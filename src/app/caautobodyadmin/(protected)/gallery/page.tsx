"use client";
import Image from "next/image";

import Link from "next/link";
import { useEffect, useMemo, useState, type DragEvent, type KeyboardEvent as ReactKeyboardEvent, type TouchEvent } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AddRounded from "@mui/icons-material/AddRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import AdminStatusTabs from "@/components/Admin/AdminStatusTabs";
import { useCmsCollection } from "@/lib/cms/useCmsCollection";
import { announceCmsChange } from "@/lib/cms/cms-sync";
import type { GalleryContent } from "@/types/content";

const BENTO_CLASSES = ["bento-wide-tall", "bento-standard", "bento-tall", "bento-standard", "bento-wide", "bento-standard", "bento-tall", "bento-standard"] as const;

function move<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const result = [...items];
  result.splice(to, 0, ...result.splice(from, 1));
  return result;
}

export default function AdminGallery() {
  const router = useRouter();
  const { items, ready, error, role, reload, duplicate, retire, lastSynced } = useCmsCollection<GalleryContent>("gallery");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [notice, setNotice] = useState("");
  const allOrdered = useMemo(() => {
    if (!orderedIds) return items;
    const byId = new Map(items.map((item) => [item.id, item]));
    return [...orderedIds, ...items.map((item) => item.id).filter((id) => !orderedIds.includes(id))]
      .map((id) => byId.get(id)).filter((item): item is GalleryContent => Boolean(item));
  }, [items, orderedIds]);
  const visible = useMemo(() => allOrdered.filter((item) =>
    (status === "all" || item.status === status) && `${item.caption} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
  ), [allOrdered, status, query]);
  const canReorder = (role === "publisher" || role === "admin") && status === "all" && !query.trim() && !saving && ready;
  useEffect(() => {
    if (!preview) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setPreview(false); };
    window.addEventListener("keydown", onEscape);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", onEscape); };
  }, [preview]);
  const previewItems = allOrdered.filter((item) => item.status === "published" || (includeDrafts && item.status === "draft"));

  function rearrange(from: number, to: number) {
    if (!canReorder || from === to) return;
    setOrderedIds(move(allOrdered.map((item) => item.id), from, to));
    setNotice("Order changed. Save layout to update the website gallery.");
  }
  function startDrag(event: DragEvent<HTMLButtonElement>, id: string) {
    if (!canReorder) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }
  function drop(event: DragEvent<HTMLElement>, destination: string) {
    event.preventDefault();
    if (!canReorder) return;
    const source = event.dataTransfer.getData("text/plain");
    rearrange(allOrdered.findIndex((item) => item.id === source), allOrdered.findIndex((item) => item.id === destination));
  }
  function keyboardMove(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (!canReorder) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowUp" && event.key !== "ArrowRight" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const destination = Math.max(0, Math.min(allOrdered.length - 1, index + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1)));
    rearrange(index, destination);
    // Focus stays on the reordered item, which React retains by stable item ID.
  }
  function touchEnd(event: TouchEvent<HTMLButtonElement>, source: string) {
    if (!canReorder) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>("[data-gallery-slot]");
    if (target) rearrange(allOrdered.findIndex((item) => item.id === source), allOrdered.findIndex((item) => item.id === target.dataset.gallerySlot));
  }
  async function saveOrder() {
    if (!orderedIds || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/cms/gallery/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderedIds }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save gallery order");
      setOrderedIds(null);
      announceCmsChange("gallery");
      await reload();
      setNotice("Gallery order saved. The published bento grid now uses this order.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Unable to save the gallery order");
    } finally { setSaving(false); }
  }
  async function copy(item: GalleryContent) {
    try { const next = await duplicate(item.id); router.push(`/caautobodyadmin/gallery/${encodeURIComponent(next.id)}`); }
    catch (reason) { void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : "Unable to duplicate image" }); }
  }
  async function remove(item: GalleryContent) {
    const result = await Swal.fire({ icon: "warning", title: "Delete this image?", text: "It will be removed from the public gallery but retained for audit.", showCancelButton: true, confirmButtonText: "Delete image", confirmButtonColor: "#963d37", focusCancel: true });
    if (!result.isConfirmed) return;
    try { await retire(item.id); setOrderedIds(null); }
    catch (reason) { void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : "Unable to delete image" }); }
  }

  return <div className="admin-gallery-manager">
    <header className="admin-page-head"><div><span>MEDIA LIBRARY / BENTO LAYOUT</span><h1>Gallery manager</h1><p>Curate image order in the same bento composition visitors see on the website.</p></div>
      <div className="admin-gallery-manager__head-actions"><button type="button" className="admin-secondary" onClick={() => { setIncludeDrafts(false); setPreview(true); }}><VisibilityOutlined fontSize="small" /> Preview gallery</button><Link className="admin-primary" href="/caautobodyadmin/gallery/new"><AddRounded fontSize="small" /> Add image</Link></div>
    </header>
    <div className="admin-gallery-manager__toolbar"><AdminStatusTabs value={status} onChange={setStatus} items={items} /><div className="admin-gallery-manager__filters"><span>{visible.length} images · {lastSynced ? "Synced" : "Syncing"}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search gallery images" aria-label="Search gallery images" /><button type="button" onClick={() => { setOrderedIds(null); void reload(); }}>Refresh</button></div></div>
    <div className="admin-gallery-manager__instruction"><DragIndicatorRounded fontSize="small" /><span><strong>Bento arrangement</strong> — drag an image by its grip to change its position. Use arrow keys on the grip for accessible reordering.</span>{orderedIds ? <div className="admin-gallery-manager__save"><button type="button" onClick={() => { setOrderedIds(null); setNotice(""); }} disabled={saving}>Discard</button><button type="button" className="admin-primary" disabled={saving} onClick={() => void saveOrder()}>{saving ? "Saving…" : "Save layout"}</button></div> : null}</div>
    {!canReorder && role === "editor" ? <p className="admin-gallery-manager__hint">Only Publishers and Admins can reorder the public gallery.</p> : null}
    {!canReorder && (role === "publisher" || role === "admin") && (query || status !== "all") ? <p className="admin-gallery-manager__hint">Switch to All and clear Search to rearrange the complete gallery without losing hidden image positions.</p> : null}
    {notice ? <p className="admin-gallery-manager__notice" role="status">{notice}</p> : null}
    {error ? <p className="admin-note" role="alert">CMS error: {error}</p> : null}
    {!ready ? <p className="admin-loading">Loading gallery…</p> : null}
    {ready && visible.length === 0 ? <div className="admin-empty"><strong>No gallery images match this view.</strong><p>Try a different filter or add a new image.</p></div> : null}
    <div className="admin-gallery-bento" aria-label="Manage gallery images in bento order">
      {visible.map((item, index) => <article className={`admin-gallery-bento__tile ${BENTO_CLASSES[index % BENTO_CLASSES.length]}`} key={item.id} data-gallery-slot={item.id}
        onDragOver={(event) => { if (canReorder) event.preventDefault(); }} onDrop={(event) => drop(event, item.id)}>
        <Image src={item.image} alt={item.caption} loading="lazy" draggable={false}  width={1600} height={900} unoptimized />
        <div className="admin-gallery-bento__top"><span className={`admin-status-badge admin-status-badge--${item.status || "draft"}`}>{item.status || "draft"}</span><button type="button" className="admin-gallery-bento__grip" draggable={canReorder} disabled={!canReorder} onDragStart={(event) => startDrag(event, item.id)} onKeyDown={(event) => keyboardMove(event, allOrdered.findIndex((candidate) => candidate.id === item.id))} onTouchEnd={(event) => touchEnd(event, item.id)} aria-label={`Reorder ${item.caption}. Use arrow keys or drag.`} title="Drag to rearrange, or use arrow keys"><DragIndicatorRounded fontSize="small" /></button></div>
        <div className="admin-gallery-bento__caption"><small>{item.category} · {String(index + 1).padStart(2, "0")}</small><strong>{item.caption}</strong><div><Link href={`/caautobodyadmin/gallery/${encodeURIComponent(item.id)}`}>Edit image <ArrowOutwardRounded fontSize="small" /></Link><button type="button" onClick={() => void copy(item)}>Duplicate</button><button type="button" className="admin-danger" onClick={() => void remove(item)}>Delete</button></div></div>
      </article>)}
    </div>
    {preview ? <div className="admin-gallery-preview" role="dialog" aria-modal="true" aria-label="Full gallery preview">
      <div className="admin-gallery-preview__header"><div><span>WEBSITE PREVIEW / GALLERY</span><h2>Gallery bento preview</h2><p>Shows the current image arrangement. Published-only is the public view; drafts are private.</p></div><div><label className="check-label"><input type="checkbox" checked={includeDrafts} onChange={(event) => setIncludeDrafts(event.target.checked)} /> Include drafts</label><button type="button" onClick={() => setPreview(false)} aria-label="Close gallery preview"><CloseRounded fontSize="small" /> Close</button></div></div>
      <div className="admin-gallery-preview__body"><div className="admin-gallery-preview__bento" aria-label="Gallery layout preview">{previewItems.map((item, index) => <div className={`admin-gallery-preview__image ${BENTO_CLASSES[index % BENTO_CLASSES.length]}`} key={item.id}><Image src={item.image} alt={item.caption} loading="lazy"  width={1600} height={900} unoptimized /><div><small>{item.category}{item.status === "draft" ? " · DRAFT" : ""}</small><strong>{item.caption}</strong></div></div>)}</div>{!previewItems.length ? <p>No images match this preview.</p> : null}</div>
      <div className="admin-gallery-preview__footer"><span><CheckCircleOutlineRounded fontSize="small" /> {includeDrafts ? "Private editor preview" : "Published images only"}{orderedIds ? " · Unsaved arrangement" : ""}</span><Link href="/gallery" target="_blank" rel="noopener noreferrer">Open live gallery <ArrowOutwardRounded fontSize="small" /></Link></div>
    </div> : null}
  </div>;
}

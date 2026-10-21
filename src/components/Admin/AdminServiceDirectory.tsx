"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import AdminStatusTabs from "@/components/Admin/AdminStatusTabs";
import { isBrandPage } from "@/lib/cms/brand-pages";
import { useCmsCollection } from "@/lib/cms/useCmsCollection";
import type { CmsServiceContent } from "@/lib/cms/public-content";

type DirectoryKind = "service" | "brand";

const copy = {
  service: { heading: "Services", singular: "service", intro: "Manage service pages, their menu placement, and homepage service-slider visibility.", empty: "No services match this view.", newLabel: "New service" },
  brand: { heading: "Brands", singular: "brand page", intro: "Manage manufacturer and specialist brand-repair pages without mixing them into general services.", empty: "No brand pages match this view.", newLabel: "New brand page" },
} as const;

export default function AdminServiceDirectory({ kind }: { kind: DirectoryKind }) {
  const router = useRouter();
  const { items, ready, error, reload, retire, duplicate, lastSynced } = useCmsCollection<CmsServiceContent>("services");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const labels = copy[kind];
  const basePath = kind === "brand" ? "/caautobodyadmin/brands" : "/caautobodyadmin/services";
  const scopedItems = useMemo(() => items.filter((item) => kind === "brand" ? isBrandPage(item) : !isBrandPage(item)), [items, kind]);
  const visible = useMemo(() => scopedItems.filter((item) => (status === "all" || item.status === status) && `${item.title} ${item.slug}`.toLowerCase().includes(query.toLowerCase())), [scopedItems, query, status]);
  async function makeCopy(item: CmsServiceContent) { try { const duplicated = await duplicate(item.slug); router.push(`${basePath}/${duplicated.slug}`); } catch (reason) { void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : `Unable to duplicate ${labels.singular}` }); } }
  async function remove(item: CmsServiceContent) { const result = await Swal.fire({ icon: "warning", title: `Delete \u201c${item.title}\u201d?`, text: "The public page will be removed. Its record remains available for audit.", showCancelButton: true, confirmButtonText: `Delete ${labels.singular}`, confirmButtonColor: "#963d37", focusCancel: true }); if (!result.isConfirmed) return; try { await retire(item.slug); } catch (reason) { void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : `Unable to delete ${labels.singular}` }); } }
  return <><div className="admin-page-head"><div><span>Content</span><h1>{labels.heading}</h1><p>{labels.intro}</p></div><Link className="admin-primary" href={`${basePath}/new`}>{labels.newLabel}</Link></div><AdminStatusTabs value={status} onChange={setStatus} items={scopedItems} /><div className="admin-toolbar"><span>{scopedItems.length} {kind === "brand" ? "brand pages" : "services"} · {lastSynced ? "Live sync active" : "Syncing"}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${kind === "brand" ? "brands" : "services"}`} aria-label={`Search ${kind === "brand" ? "brands" : "services"}`} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="draft">Drafts</option><option value="published">Published</option><option value="retired">Deleted</option></select><button type="button" onClick={() => void reload()}>Refresh CMS</button></div>{error ? <p className="admin-note" role="alert">CMS error: {error}</p> : null}{!ready ? <p className="admin-loading">Loading {kind === "brand" ? "brand pages" : "services"}...</p> : null}{ready && !visible.length ? <div className="admin-empty"><strong>{labels.empty}</strong><p>Change the search or status filter, or create a new Draft.</p></div> : null}<div className="admin-card-grid">{visible.map((item) => <article className="admin-content-card" key={item.slug}><Image src={item.image || "/images/hero-left-car.jpg"} alt="" width={1600} height={900} unoptimized /><div><span className={`admin-status-badge admin-status-badge--${item.status}`}>{item.status}</span><h2>{item.title}</h2><p>{item.intro}</p><small>/services/{item.slug}{item.placement.navigation ? " · Services menu" : ""}{item.placement.homeSlider ? " · Homepage slider" : ""}</small><div className="table-actions"><Link href={`${basePath}/${item.slug}`}>Edit</Link><Link href={`${basePath}/${item.slug}/preview`} target="_blank" rel="noopener noreferrer">Preview</Link><button type="button" onClick={() => void makeCopy(item)}>Duplicate</button><button className="admin-danger" type="button" onClick={() => void remove(item)}>Delete</button></div></div></article>)}</div></>;
}

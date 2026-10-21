"use client";
import Image from "next/image";

import Link from "next/link";
import AdminStatusTabs from "@/components/Admin/AdminStatusTabs";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useCmsCollection, type CmsCollection } from "@/lib/cms/useCmsCollection";

type Kind = Extract<CmsCollection, "offers" | "areas">;
type Item = { slug: string; title?: string; name?: string; intro: string; image: string; status?: "draft" | "published" | "retired" };
export default function AdminStructuredCollection({ collection, heading }: { collection: Kind; heading: string }) {
  const router = useRouter(); const { items, ready, error, reload, duplicate, retire, lastSynced } = useCmsCollection<Item>(collection); const [query, setQuery] = useState(""); const [status, setStatus] = useState("all");
  const visible = useMemo(() => items.filter((item) => (status === "all" || item.status === status) && `${item.title || item.name} ${item.slug}`.toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  async function copy(item: Item) { try { const next = await duplicate(item.slug); router.push(`/caautobodyadmin/${collection}/${next.slug}`); } catch (reason) { void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : "Unable to duplicate content" }); } }
  async function remove(item: Item) { const result = await Swal.fire({ icon: "warning", title: `Delete “${item.title || item.name}”?`, text: "The public page will be removed while its record remains available for audit.", showCancelButton: true, confirmButtonText: "Delete", confirmButtonColor: "#963d37", focusCancel: true }); if (result.isConfirmed) { try { await retire(item.slug); } catch (reason) { void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : "Unable to delete content" }); } } }
  const noun = collection === "offers" ? "offer" : "area";
  return <><div className="admin-page-head"><div><span>Content</span><h1>{heading}</h1><p>Manage public pages, Drafts, imagery, and search metadata from one workspace.</p></div><Link className="admin-primary" href={`/caautobodyadmin/${collection}/new`}>New {noun}</Link></div><AdminStatusTabs value={status} onChange={setStatus} items={items} /><div className="admin-toolbar"><span>{items.length} records · {lastSynced ? "Live sync active" : "Syncing"}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${heading.toLowerCase()}`} aria-label={`Search ${heading.toLowerCase()}`} /><button type="button" onClick={() => void reload()}>Refresh CMS</button></div>{error ? <p role="alert" className="admin-note">{error}</p> : null}{!ready ? <p className="admin-loading">Loading CMS content...</p> : null}{ready && !visible.length ? <div className="admin-empty"><strong>No pages match this view.</strong><p>Change the search or filter, or create a new Draft.</p></div> : null}<div className="admin-card-grid">{visible.map((item) => <article className="admin-content-card" key={item.slug}><Image src={item.image || "/images/Banner.webp"} alt=""  width={1600} height={900} unoptimized /><div><span className={`admin-status-badge admin-status-badge--${item.status || "draft"}`}>{item.status || "draft"}</span><h2>{item.title || item.name}</h2><p>{item.intro}</p><small>/{collection === "offers" ? "offers" : "areas-we-serve"}/{item.slug}</small><div className="table-actions"><Link href={`/caautobodyadmin/${collection}/${item.slug}`}>Edit</Link><Link href={`/caautobodyadmin/${collection}/${item.slug}/preview`} target="_blank" rel="noopener noreferrer">Preview</Link><button type="button" onClick={() => void copy(item)}>Duplicate</button><button className="admin-danger" type="button" onClick={() => void remove(item)}>Delete</button></div></div></article>)}</div></>;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import type { ContactEnquiry, EnquiryStatus } from "@/lib/enquiries";
import { announceCmsChange, CMS_SYNC_EVENT, CMS_SYNC_STORAGE_KEY, readCmsSyncNotice } from "@/lib/cms/cms-sync";

const statuses: EnquiryStatus[] = ["new", "in-progress", "resolved", "archived"];
const pageSize = 20;
const formatDate = (value: string) => new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function ContactsPage() {
  const [items, setItems] = useState<ContactEnquiry[]>([]);
  const [filter, setFilter] = useState<EnquiryStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ContactEnquiry | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const response = await fetch("/api/admin/enquiries", { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Unable to load enquiries");
    setItems(result.items || []);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    const refresh = () => { if (mounted && document.visibilityState === "visible") void reload(true).catch(() => {}); };
    void reload().catch((reason) => { if (mounted) { setError(reason instanceof Error ? reason.message : "Unable to load enquiries"); setLoading(false); } });
    const timer = window.setInterval(refresh, 15_000);
    const onChange = () => refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CMS_SYNC_STORAGE_KEY && readCmsSyncNotice(event.newValue)?.collection === "enquiries") refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CMS_SYNC_EVENT, onChange);
    document.addEventListener("visibilitychange", refresh);
    return () => { mounted = false; window.clearInterval(timer); window.removeEventListener("storage", onStorage); window.removeEventListener(CMS_SYNC_EVENT, onChange); document.removeEventListener("visibilitychange", refresh); };
  }, [reload]);
  useEffect(() => { setPage(1); }, [filter, query]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesStatus = filter === "all" || item.status === filter;
    const searchable = `${item.name} ${item.email} ${item.phone} ${item.service} ${item.suburb}`.toLowerCase();
    return matchesStatus && searchable.includes(query.trim().toLowerCase());
  }), [filter, items, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);

  async function updateStatus(id: string, status: EnquiryStatus) {
    const response = await fetch(`/api/admin/enquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Unable to update enquiry");
    announceCmsChange("enquiries");
    await reload();
    setSelected((current) => current?.id === id ? { ...current, status } : current);
    void Swal.fire({ icon: "success", title: status === "archived" ? "Enquiry archived" : "Enquiry updated", timer: 1500, showConfirmButton: false });
  }

  async function archive(item: ContactEnquiry) {
    const result = await Swal.fire({ icon: "warning", title: "Archive this enquiry?", text: "Archived enquiries remain in the CMS audit trail but leave the active inbox.", showCancelButton: true, confirmButtonText: "Archive enquiry", confirmButtonColor: "#963d37", focusCancel: true });
    if (!result.isConfirmed) return;
    try { await updateStatus(item.id, "archived"); setSelected(null); }
    catch (reason) { void Swal.fire({ icon: "error", text: reason instanceof Error ? reason.message : "Unable to archive enquiry" }); }
  }

  return <>
    <div className="admin-page-head"><div><span>Customer enquiries</span><h1>Contact management</h1><p>Review and progress enquiries submitted through the CA Autobody website.</p></div></div>
    <div className="admin-toolbar admin-contact-toolbar"><span>{filtered.length} {filtered.length === 1 ? "enquiry" : "enquiries"}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, service or suburb" aria-label="Search enquiries" /><label>Status<select value={filter} onChange={(event) => setFilter(event.target.value as EnquiryStatus | "all")}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status.replace("-", " ")}</option>)}</select></label><button type="button" onClick={() => void reload().catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load enquiries"))}>Refresh</button></div>
    {error ? <p className="admin-note" role="alert">{error}</p> : null}
    <section className="admin-panel admin-contact-panel">
      {loading ? <p className="admin-loading" role="status">Loading enquiries...</p> : null}
      {!loading && visible.length ? <div className="admin-table admin-table--contacts"><div className="admin-table__row head"><span>Enquirer</span><span>Service</span><span>Received</span><span>Status</span><span>Actions</span></div>{visible.map((item) => <div className="admin-table__row" key={item.id}><strong>{item.name}<small>{item.email || "No email provided"} · {item.phone}</small></strong><span>{item.service}</span><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time><span><b className={`admin-status admin-status--${item.status}`}>{item.status.replace("-", " ")}</b></span><span className="table-actions"><button type="button" onClick={() => setSelected(item)}>Open</button>{item.status !== "archived" ? <button className="admin-danger" type="button" onClick={() => void archive(item)}>Archive</button> : null}</span></div>)}</div> : null}
      {!loading && !visible.length ? <div className="admin-empty"><strong>No enquiries match this view.</strong><p>Try another search or status filter.</p></div> : null}
      {!loading && totalPages > 1 ? <nav className="admin-pagination" aria-label="Enquiry pages"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page {Math.min(page, totalPages)} of {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button></nav> : null}
    </section>
    {selected ? <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-title"><button className="admin-modal__backdrop" aria-label="Close enquiry" onClick={() => setSelected(null)} /><section className="admin-modal__panel admin-enquiry-detail"><div className="admin-modal__head"><div><small>{selected.enquiryType === "brand-assessment" ? "Brand assessment" : "Contact enquiry"}</small><h2 id="enquiry-title">{selected.name}</h2></div><button type="button" aria-label="Close enquiry" onClick={() => setSelected(null)}>×</button></div><dl><div><dt>Email</dt><dd>{selected.email ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : "Not provided"}</dd></div><div><dt>Phone</dt><dd><a href={`tel:${selected.phone.replace(/\s/g, "")}`}>{selected.phone}</a></dd></div><div><dt>Suburb</dt><dd>{selected.suburb || "Not provided"}</dd></div><div><dt>Service</dt><dd>{selected.service}</dd></div>{selected.brand ? <div><dt>Brand</dt><dd>{selected.brand}</dd></div> : null}{selected.vehicle ? <div><dt>Vehicle</dt><dd>{selected.vehicle}</dd></div> : null}{selected.claimStatus ? <div><dt>Claim status</dt><dd>{selected.claimStatus}</dd></div> : null}<div><dt>Received</dt><dd>{formatDate(selected.createdAt)}</dd></div></dl>{selected.attachments?.length ? <div className="admin-enquiry-message"><small>Attached photo names</small><p>{selected.attachments.join(", ")}</p></div> : null}<div className="admin-enquiry-message"><small>Message</small><p>{selected.message}</p></div><label className="admin-enquiry-status">Enquiry status<select value={selected.status} onChange={(event) => void updateStatus(selected.id, event.target.value as EnquiryStatus)}>{statuses.map((status) => <option key={status} value={status}>{status.replace("-", " ")}</option>)}</select></label></section></div> : null}
  </>;
}

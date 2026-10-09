"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  contactMockEvent,
  getContactEnquiries,
  type ContactEnquiry,
  type EnquiryStatus,
  saveContactEnquiries,
} from "@/lib/contactMock";

const statuses: EnquiryStatus[] = ["new", "in-progress", "resolved"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ContactsPage() {
  const [items, setItems] = useState<ContactEnquiry[]>([]);
  const [filter, setFilter] = useState<EnquiryStatus | "all">("all");
  const [selected, setSelected] = useState<ContactEnquiry | null>(null);

  useEffect(() => {
    const refresh = () => setItems(getContactEnquiries());
    refresh();
    window.addEventListener(contactMockEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(contactMockEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = useMemo(() => filter === "all" ? items : items.filter((item) => item.status === filter), [filter, items]);

  function updateStatus(id: string, status: EnquiryStatus) {
    const next = items.map((item) => item.id === id ? { ...item, status } : item);
    saveContactEnquiries(next);
    setSelected(next.find((item) => item.id === id) || null);
  }

  async function remove(item: ContactEnquiry) {
    const result = await Swal.fire({ icon: "warning", title: "Delete this enquiry?", text: "This removes the browser-local mockup entry only.", showCancelButton: true, confirmButtonText: "Delete enquiry", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (result.isConfirmed) {
      saveContactEnquiries(items.filter((entry) => entry.id !== item.id));
      setSelected(null);
    }
  }

  return <>
    <div className="admin-page-head"><div><span>Customer enquiries</span><h1>Contact management</h1><p>Preview enquiries submitted through the public contact forms in this browser.</p></div></div>
    <div className="admin-toolbar admin-contact-toolbar"><span>{items.length} total {items.length === 1 ? "enquiry" : "enquiries"}</span><label>Show<select value={filter} onChange={(event) => setFilter(event.target.value as EnquiryStatus | "all")}><option value="all">All enquiries</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label></div>
    <section className="admin-panel admin-contact-panel">
      {filtered.length ? <div className="admin-table admin-table--contacts"><div className="admin-table__row head"><span>Enquirer</span><span>Service</span><span>Received</span><span>Status</span><span>Actions</span></div>{filtered.map((item) => <div className="admin-table__row" key={item.id}><strong>{item.name}<small>{item.email || "No email provided"}{" \u00b7 "}{item.phone}</small></strong><span>{item.service}</span><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time><span><b className={`admin-status admin-status--${item.status}`}>{item.status.replace("-", " ")}</b></span><span className="table-actions"><button onClick={() => setSelected(item)}>View</button><button className="admin-danger" onClick={() => void remove(item)}>Delete</button></span></div>)}</div> : <div className="admin-empty"><strong>No contact enquiries yet.</strong><p>Submit a public contact form to preview the inbox and notification flow.</p></div>}
    </section>
    {selected ? <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-title"><button className="admin-modal__backdrop" aria-label="Close enquiry" onClick={() => setSelected(null)} /><section className="admin-modal__panel admin-enquiry-detail"><div className="admin-modal__head"><div><small>{selected.enquiryType === "brand-assessment" ? "Brand assessment" : "Contact enquiry"}</small><h2 id="enquiry-title">{selected.name}</h2></div><button type="button" aria-label="Close enquiry" onClick={() => setSelected(null)}>{"\u00d7"}</button></div><dl><div><dt>Email</dt><dd>{selected.email ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : "Not provided"}</dd></div><div><dt>Phone</dt><dd><a href={`tel:${selected.phone.replace(/\s/g, "")}`}>{selected.phone}</a></dd></div><div><dt>Suburb</dt><dd>{selected.suburb || "Not provided"}</dd></div><div><dt>Service</dt><dd>{selected.service}</dd></div>{selected.brand ? <div><dt>Brand</dt><dd>{selected.brand}</dd></div> : null}{selected.vehicle ? <div><dt>Vehicle</dt><dd>{selected.vehicle}</dd></div> : null}{selected.claimStatus ? <div><dt>Claim status</dt><dd>{selected.claimStatus}</dd></div> : null}<div><dt>Received</dt><dd>{formatDate(selected.createdAt)}</dd></div></dl>{selected.attachments?.length ? <div className="admin-enquiry-message"><small>Selected photo filenames</small><p>{selected.attachments.join(", ")}</p></div> : null}<div className="admin-enquiry-message"><small>Message</small><p>{selected.message}</p></div><label className="admin-enquiry-status">Enquiry status<select value={selected.status} onChange={(event) => updateStatus(selected.id, event.target.value as EnquiryStatus)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label><p className="admin-note">Mockup boundary: this preview is browser-local. Live email delivery and shared enquiries require the future backend and email-service phase.</p></section></div> : null}
  </>;
}

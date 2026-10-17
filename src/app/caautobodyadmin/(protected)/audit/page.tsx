"use client";

import { useCallback, useEffect, useState } from "react";

type AuditEvent = {
  id: number;
  actor_id: string | null;
  actor_email: string | null;
  table_name: string;
  record_id: string | null;
  operation: "INSERT" | "UPDATE" | "DELETE" | "DEACTIVATE" | "REACTIVATE" | "EXPORT" | "LEGACY";
  old_status: string | null;
  new_status: string | null;
  created_at: string;
};

const tableLabels: Record<string, string> = {
  cms_blog_posts: "Blogs",
  cms_services: "Services",
  cms_locations: "Areas",
  cms_offers: "Offers",
  cms_faqs: "FAQs",
  cms_gallery_items: "Gallery",
  cms_page_sections: "Page content",
  cms_site_settings: "Settings",
  cms_enquiries: "Enquiries",
  cms_admin_members: "Team & access",
  analytics_exports: "Analytics exports",
};

const operationLabels: Record<AuditEvent["operation"], string> = {
  INSERT: "Created", UPDATE: "Updated", DELETE: "Removed", DEACTIVATE: "Deactivated", REACTIVATE: "Reactivated", EXPORT: "Exported", LEGACY: "Imported legacy event",
};

export default function AuditPage() {
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [table, setTable] = useState("");
  const [operation, setOperation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "100" });
      if (table) query.set("table", table);
      if (operation) query.set("operation", operation);
      const response = await fetch(`/api/admin/audit?${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Audit history is unavailable.");
      setItems(result.items || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Audit history is unavailable.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [operation, table]);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <div className="admin-page-head">
        <div><span>Security</span><h1>Audit log</h1><p>Read-only CMS activity recorded by the database for authorized administrators.</p></div>
      </div>
      <section className="admin-panel">
        <div className="panel-head"><div><h2>Recent activity</h2></div><small>Latest 100 events</small></div>
        <div className="admin-toolbar" aria-label="Audit log filters">
          <label>Module<select value={table} onChange={(event) => setTable(event.target.value)}><option value="">All modules</option>{Object.entries(tableLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>Action<select value={operation} onChange={(event) => setOperation(event.target.value)}><option value="">All actions</option>{Object.entries(operationLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        </div>
        {error ? <p className="admin-note" role="alert">{error}</p> : null}
        {loading ? <p className="admin-loading">Loading audit history...</p> : null}
        {!loading && !error ? <div className="admin-audit-list">{items.length ? items.map((event) => {
          const changedStatus = event.old_status !== event.new_status && (event.old_status || event.new_status);
          return <article key={event.id}><div><b>{event.actor_email || "Legacy CMS event"}</b><span>{operationLabels[event.operation] || event.operation} {tableLabels[event.table_name] || event.table_name}</span><small>Record: {event.record_id || "not recorded"}{changedStatus ? ` | ${event.old_status || "none"} to ${event.new_status || "none"}` : ""}</small></div><time dateTime={event.created_at}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</time></article>;
        }) : <p className="admin-note">No matching CMS activity has been recorded yet.</p>}</div> : null}
      </section>
    </>
  );
}

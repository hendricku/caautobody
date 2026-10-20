"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type CmsCollection = "blogs" | "services" | "faqs" | "gallery" | "offers" | "areas";
const CMS_SYNC_INTERVAL_MS = 15_000;
export function useCmsCollection<T extends object>(collection: CmsCollection) {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("editor");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const latestRequest = useRef(0);
  const reload = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    const requestId = ++latestRequest.current;
    if (!silent) setError("");
    try {
      const response = await fetch(`/api/admin/cms/${collection}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load CMS content");
      if (requestId !== latestRequest.current) return;
      setItems(result.items as T[]); setRole(result.role); setLastSynced(new Date());
    } catch (err) { if (!silent && requestId === latestRequest.current) setError(err instanceof Error ? err.message : "CMS unavailable"); }
    finally { if (requestId === latestRequest.current) setReady(true); }
  }, [collection]);
  useEffect(() => {
    void reload();
    const syncWhenVisible = () => { if (document.visibilityState === "visible") void reload({ silent: true }); };
    const timer = window.setInterval(syncWhenVisible, CMS_SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", syncWhenVisible); };
  }, [reload]);
  const save = useCallback(async (item: T, originalId?: string) => {
    setError("");
    const response = await fetch(`/api/admin/cms/${collection}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item, originalId }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Save failed"); throw new Error(result.error || "Save failed"); }
    await reload();
    return result.item as T;
  }, [collection, reload]);
  const retire = useCallback(async (id: string) => {
    setError("");
    const response = await fetch(`/api/admin/cms/${collection}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Retire failed"); throw new Error(result.error || "Retire failed"); }
    await reload();
  }, [collection, reload]);
  const duplicate = useCallback(async (sourceId: string) => {
    setError("");
    const response = await fetch(`/api/admin/cms/${collection}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Duplicate failed"); throw new Error(result.error || "Duplicate failed"); }
    await reload();
    return result.item as T;
  }, [collection, reload]);
  return { items, ready, error, role, lastSynced, save, retire, duplicate, reload };
}

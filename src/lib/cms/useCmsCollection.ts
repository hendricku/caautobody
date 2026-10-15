"use client";
import { useCallback, useEffect, useState } from "react";

export type CmsCollection = "blogs" | "services" | "faqs" | "gallery" | "offers" | "areas";
export function useCmsCollection<T extends object>(collection: CmsCollection) {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("editor");
  const reload = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`/api/admin/cms/${collection}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load CMS content");
      setItems(result.items as T[]); setRole(result.role);
    } catch (err) { setError(err instanceof Error ? err.message : "CMS unavailable"); }
    finally { setReady(true); }
  }, [collection]);
  useEffect(() => { void reload(); }, [reload]);
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
  return { items, ready, error, role, save, retire, reload };
}

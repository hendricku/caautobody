/** Browser-only, non-sensitive change hints. Never carries CMS records or credentials. */
export const CMS_SYNC_EVENT = "ca-cms-sync";
export const CMS_SYNC_STORAGE_KEY = "ca-cms-sync-version";

export type CmsSyncNotice = { collection: string; at: number };

/** Call ONLY after the API confirms the write; receivers re-fetch authorized data. */
export function announceCmsChange(collection: string) {
  if (typeof window === "undefined") return;
  const notice: CmsSyncNotice = { collection, at: Date.now() };
  window.dispatchEvent(new CustomEvent<CmsSyncNotice>(CMS_SYNC_EVENT, { detail: notice }));
  try { window.localStorage.setItem(CMS_SYNC_STORAGE_KEY, JSON.stringify(notice)); } catch { /* Private browsing */ }
}

export function readCmsSyncNotice(serialized: string | null): CmsSyncNotice | null {
  if (!serialized || serialized.length > 200) return null;
  try {
    const value = JSON.parse(serialized) as Partial<CmsSyncNotice>;
    return typeof value.collection === "string" && /^[a-z-]{1,24}$/.test(value.collection) && typeof value.at === "number"
      && Number.isFinite(value.at) ? { collection: value.collection, at: value.at } : null;
  } catch { return null; }
}

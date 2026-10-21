"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CMS_SYNC_EVENT, CMS_SYNC_STORAGE_KEY, readCmsSyncNotice } from "@/lib/cms/cms-sync";

const DASHBOARD_REFRESH_MS = 15_000;
const PUBLICATION_CHECK_GAP_MS = 2_000;

/** Signals do not contain rows. Each editor/list reads fresh data using its
 * existing authenticated API. Dashboard server counts refresh in place.
 */
export default function AdminLiveSync() {
  const pathname = usePathname();
  const router = useRouter();
  const lastVersion = useRef<string | null>(null);
  const lastCheck = useRef(0);
  const lastDashboardRefresh = useRef(0);
  const isDashboard = pathname === "/caautobodyadmin/dashboard";

  useEffect(() => {
    let active = true;
    const refreshDashboard = () => {
      if (!active || !isDashboard || document.visibilityState !== "visible") return;
      if (Date.now() - lastDashboardRefresh.current < 1000) return;
      lastDashboardRefresh.current = Date.now();
      router.refresh();
    };
    const onChange = () => refreshDashboard();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CMS_SYNC_STORAGE_KEY && readCmsSyncNotice(event.newValue)) refreshDashboard();
    };
    window.addEventListener(CMS_SYNC_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", refreshDashboard);
    const timer = window.setInterval(refreshDashboard, DASHBOARD_REFRESH_MS);

    async function verifyPublishedChange() {
      if (!active || Date.now() - lastCheck.current < PUBLICATION_CHECK_GAP_MS) return;
      lastCheck.current = Date.now();
      try {
        const result = await fetch("/api/public/content-version", { cache: "no-store" });
        const body = await result.json().catch(() => null);
        if (!active || !result.ok || typeof body?.version !== "string") return;
        if (lastVersion.current !== null && lastVersion.current !== body.version) {
          // A remote publication changed. Refetch lists, but never overwrite
          // editor form state — forms initialize only on initial load.
          window.dispatchEvent(new Event(CMS_SYNC_EVENT));
        }
        lastVersion.current = body.version;
      } catch { /* Poll fallback remains active. */ }
    }
    void verifyPublishedChange();
    const versionTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void verifyPublishedChange();
    }, 12_000);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    let client: ReturnType<typeof createClient> | undefined;
    if (url && key) {
      client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      client.channel("cms-publication")
        .on("broadcast", { event: "content-published" }, () => { void verifyPublishedChange(); })
        .subscribe();
    }
    return () => {
      active = false;
      window.clearInterval(timer); window.clearInterval(versionTimer);
      window.removeEventListener(CMS_SYNC_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", refreshDashboard);
      if (client) void client.removeAllChannels();
    };
  }, [isDashboard, router]);
  return null;
}

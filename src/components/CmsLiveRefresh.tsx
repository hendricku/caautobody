"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 5_000;
const MIN_CHECK_GAP_MS = 1_000;

/**
 * Public pages receive only a content-version signal, never CMS rows. A
 * version check confirms a real publication before refreshing the route, so a
 * forged public broadcast cannot expose content or force repeated refreshes.
 */
export default function CmsLiveRefresh() {
  const router = useRouter();
  const version = useRef<string | null>(null);
  const lastCheck = useRef(0);

  useEffect(() => {
    let active = true;
    const checkVersion = async () => {
      const now = Date.now();
      if (!active || now - lastCheck.current < MIN_CHECK_GAP_MS) return;
      lastCheck.current = now;
      try {
        const response = await fetch("/api/public/content-version", { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload || typeof payload.version !== "string") return;
        if (version.current && version.current !== payload.version) router.refresh();
        version.current = payload.version;
      } catch {
        // Live refresh is progressive enhancement. Public pages remain usable
        // when the network or Realtime is unavailable.
      }
    };

    void checkVersion();
    const timer = window.setInterval(() => void checkVersion(), CHECK_INTERVAL_MS);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return () => { active = false; window.clearInterval(timer); };

    const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const channel = client.channel("cms-publication")
      .on("broadcast", { event: "content-published" }, () => { void checkVersion(); })
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(timer);
      void client.removeChannel(channel);
    };
  }, [router]);

  return null;
}

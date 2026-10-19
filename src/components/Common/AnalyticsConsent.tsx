"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

export default function AnalyticsConsent({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const query = searchParams.toString();
    trackAnalyticsEvent("page_view", {
      page_path: `${pathname}${query ? `?${query}` : ""}`,
      page_location: window.location.href,
    });
  }, [pathname, ready, searchParams]);

  useEffect(() => {
    if (!ready) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = target.getAttribute("href") || "";
      if (href.startsWith("tel:")) {
        trackAnalyticsEvent("phone_click", { link_location: window.location.pathname });
      } else if (href === "/contact" || href.startsWith("/contact?")) {
        trackAnalyticsEvent("quote_cta_click", {
          cta_label: (target.textContent || "Contact CA Autobody").trim().slice(0, 100),
          link_location: window.location.pathname,
        });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [ready]);

  const initialise = () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false, anonymize_ip: true });
    setReady(true);
  };

  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" onLoad={initialise} />;
}

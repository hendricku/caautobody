"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ANALYTICS_CONSENT_KEY, trackAnalyticsEvent } from "@/lib/analytics/client";

type ConsentChoice = "granted" | "denied" | null;

export default function AnalyticsConsent({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (saved === "granted" || saved === "denied") setChoice(saved);
    const openPreferences = () => setChoice(null);
    window.addEventListener("caautobody:analytics-preferences", openPreferences);
    return () => window.removeEventListener("caautobody:analytics-preferences", openPreferences);
  }, []);

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

  const choose = (next: Exclude<ConsentChoice, null>) => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, next);
    setChoice(next);
  };

  const initialise = () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false, anonymize_ip: true });
    setReady(true);
  };

  return <>
    {choice === "granted" ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" onLoad={initialise} /> : null}
    {choice === null ? <aside className="analytics-consent" role="dialog" aria-label="Analytics preference">
      <p>We use optional analytics to understand website use. No contact-form details are sent to Google.</p>
      <div><button type="button" onClick={() => choose("denied")}>No thanks</button><button type="button" onClick={() => choose("granted")}>Allow analytics</button></div>
    </aside> : null}
  </>;
}

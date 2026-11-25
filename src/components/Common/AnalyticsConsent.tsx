"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { createCallForwardingController } from "@/lib/analytics/call-forwarding";

export default function AnalyticsConsent({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);
  const forwarding = useRef<ReturnType<typeof createCallForwardingController> | null>(null);

  useEffect(() => {
    if (!forwarding.current) forwarding.current = createCallForwardingController(document);
    const controller = forwarding.current;
    controller.start();

    if (!initialized.current) {
      initialized.current = true;
      window.dataLayer = window.dataLayer || [];
      // Google's tag consumes the arguments object rather than a rest-parameter array.
      // eslint-disable-next-line prefer-rest-params
      window.gtag = window.gtag || function () { window.dataLayer?.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false, anonymize_ip: true });

      const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18353056138";
      const callLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL?.trim() || "F9PfCI6X6KodEIrTta9E";
      if (/^AW-\d+$/.test(adsId) && /^[A-Za-z0-9_-]+$/.test(callLabel)) {
        window.gtag("config", adsId);
        window.gtag("config", adsId + "/" + callLabel, {
          phone_conversion_number: "03 9772 7411",
          phone_conversion_callback: (formatted: string, dial: string) => controller.setForwardingNumber(formatted, dial),
        });
      }
      setReady(true);
    }

    return () => controller.stop();
  }, [measurementId]);

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

  return ready ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" /> : null;
}

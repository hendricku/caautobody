"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[][];
  }
}

export const ANALYTICS_CONSENT_KEY = "caautobody.analytics-consent";

export function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
}

export function trackAnalyticsEvent(name: string, parameters: Record<string, string | number | boolean> = {}) {
  if (!hasAnalyticsConsent() || typeof window.gtag !== "function") return;
  window.gtag("event", name, parameters);
}

import { Suspense } from "react";
import AnalyticsConsent from "@/components/Common/AnalyticsConsent";

export default function GoogleTags() {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID?.trim();
  if (!ga4Id || !/^G-[A-Z0-9]+$/.test(ga4Id)) return null;
  return <Suspense fallback={null}><AnalyticsConsent measurementId={ga4Id} /></Suspense>;
}

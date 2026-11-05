"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import QuickActions from "@/components/Public/V4/QuickActions";
import RevealObserver from "@/components/Public/V4/RevealObserver";
import InnerFinalCTA from "@/components/Public/V4/InnerFinalCTA";

import type { getPublicSiteSettings, getPublishedServiceNavigation } from "@/lib/cms/public-content";

type Settings = Awaited<ReturnType<typeof getPublicSiteSettings>>;
type ServiceNavigation = Awaited<ReturnType<typeof getPublishedServiceNavigation>>;
export default function AppChrome({ children, siteSettings, serviceNavigation, publishedServiceSlugs }: { children: React.ReactNode; siteSettings: Settings; serviceNavigation: ServiceNavigation; publishedServiceSlugs: string[] }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/caautobodyadmin");
  // Paid-ads landing pages have their own focused header and footer.
  const isAdsLandingPage = pathname.startsWith("/offers/");
  if (admin || isAdsLandingPage) return <>{children}</>;

  const showClosingCTA = pathname !== "/thank-you";

  return (
    <>
      <a className="hp-skip" href="#main-content">Skip to content</a>
      <SiteHeader siteSettings={siteSettings} serviceNavigation={serviceNavigation} />
      <div id="main-content">{children}</div>
      {showClosingCTA ? <InnerFinalCTA /> : null}
      <SiteFooter siteSettings={siteSettings} publishedServiceSlugs={publishedServiceSlugs} />
      <QuickActions />
      <RevealObserver />
    </>
  );
}

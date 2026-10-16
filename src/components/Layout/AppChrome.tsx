"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import QuickActions from "@/components/Public/V4/QuickActions";
import RevealObserver from "@/components/Public/V4/RevealObserver";
import InnerFinalCTA from "@/components/Public/V4/InnerFinalCTA";

import type { getPublicSiteSettings } from "@/lib/cms/public-content";

type Settings = Awaited<ReturnType<typeof getPublicSiteSettings>>;
export default function AppChrome({ children, siteSettings }: { children: React.ReactNode; siteSettings: Settings }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/caautobodyadmin");
  if (admin) return <>{children}</>;

  const showClosingCTA = pathname !== "/thank-you";

  return (
    <>
      <a className="hp-skip" href="#main-content">Skip to content</a>
      <SiteHeader siteSettings={siteSettings} />
      <div id="main-content">{children}</div>
      {showClosingCTA ? <InnerFinalCTA /> : null}
      <SiteFooter siteSettings={siteSettings} />
      <QuickActions />
      <RevealObserver />
    </>
  );
}

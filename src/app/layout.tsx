import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./v4.css";
import "./v4-inner.css";
import "./blog-article.css";
import "leaflet/dist/leaflet.css";
import "./site-enhancements.css";
import "./service-editorial.css";
import "./premium-refinements.css";
import "./service-refresh.css";
import "./page-hero-editorial.css";
import "./admin-design-system.css";
import AppChrome from "@/components/Layout/AppChrome";
import GoogleTags from "@/components/Common/GoogleTags";
import CmsLiveRefresh from "@/components/CmsLiveRefresh";
import { getPublicSiteSettings, getPublishedServiceNavigation } from "@/lib/cms/public-content";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://caautobody.com.au"),
  title: { default: "CA Autobody | Smash Repairs Melbourne", template: "%s | CA Autobody" },
  description: "CA Autobody provides smash repair, panel beating, refinishing, accident assistance and EV repair services from Chelsea Heights, Melbourne."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [siteSettings, serviceNavigation] = await Promise.all([getPublicSiteSettings(), getPublishedServiceNavigation()]);
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="home-v2">
        <GoogleTags />
        <CmsLiveRefresh />
        <AppChrome siteSettings={siteSettings} serviceNavigation={serviceNavigation}>{children}</AppChrome>
      </body>
    </html>
  );
}

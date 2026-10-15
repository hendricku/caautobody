import type { MetadataRoute } from "next";
import { getPublishedBlogs, getPublishedLocations, getPublishedOffers, getPublishedServices } from "@/lib/cms/public-content";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://caautobody.com.au";
  const staticPaths = ["", "/about", "/services", "/areas-we-serve", "/offers", "/blog", "/gallery", "/contact", "/frequently-asked-questions", "/sitemap", "/privacy-policy", "/terms-and-conditions"];
  const [services, locations, offers, blogs] = await Promise.all([getPublishedServices(), getPublishedLocations(), getPublishedOffers(), getPublishedBlogs()]);
  return [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly" as const, priority: path === "" ? 1 : .7 })),
    ...services.map(({slug}) => ({ url: `${base}/services/${slug}`, changeFrequency: "monthly" as const, priority: .8 })),
    ...locations.map(({slug}) => ({ url: `${base}/areas-we-serve/${slug}`, changeFrequency: "monthly" as const, priority: .65 })),
    ...offers.map(({slug}) => ({ url: `${base}/offers/${slug}`, changeFrequency: "monthly" as const, priority: .75 })),
    ...blogs.map(({slug}) => ({ url: `${base}/blog/${slug}`, changeFrequency: "monthly" as const, priority: .65 })),
  ];
}

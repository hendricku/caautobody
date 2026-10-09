import type { MetadataRoute } from "next";
import { blogs, locations, offers, services } from "@/lib/siteContent";
export default function sitemap():MetadataRoute.Sitemap{
  const base="https://caautobody.com.au";
  const staticPaths=["","/about","/services","/areas-we-serve","/offers","/blog","/gallery","/contact","/frequently-asked-questions","/sitemap","/thank-you","/privacy-policy","/terms-and-conditions"];
  return [
    ...staticPaths.map((path)=>({url:`${base}${path}`,changeFrequency:"monthly" as const,priority:path===""?1:.7})),
    ...services.map((item)=>({url:`${base}/services/${item.slug}`,changeFrequency:"monthly" as const,priority:.8})),
    ...locations.map((item)=>({url:`${base}/areas-we-serve/${item.slug}`,changeFrequency:"monthly" as const,priority:.65})),
    ...offers.map((item)=>({url:`${base}/offers/${item.slug}`,changeFrequency:"monthly" as const,priority:.75})),
    ...blogs.map((item)=>({url:`${base}/blog/${item.slug}`,changeFrequency:"monthly" as const,priority:.65}))
  ];
}

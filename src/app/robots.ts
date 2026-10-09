import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/caautobodyadmin/"]},sitemap:"https://caautobody.com.au/sitemap.xml"}}

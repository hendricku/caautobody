import type { CmsServiceContent } from "@/lib/cms/public-content";

// Brand pages are service records on the public site, but have a distinct
// editorial home in the CMS. Keeping the classification here avoids a second
// table, duplicate slugs, and two sources of truth for the same public page.
export const CORE_BRAND_SERVICE_SLUGS = [
  "tesla-approved-repair-centre",
  "services-zeekr-approved-repairer-melbourne",
  "byd-approved-repairer-melbourne",
  "lexus-approved-body-shop-melbourne",
] as const;

const coreBrandSlugs = new Set<string>(CORE_BRAND_SERVICE_SLUGS);

export function isBrandPage(service: Pick<CmsServiceContent, "slug" | "presentation">) {
  return coreBrandSlugs.has(service.slug) || service.presentation?.variant === "brand";
}

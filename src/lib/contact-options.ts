import mapOnlySuburbs from "../../caautobody_341_suburbs (1).json";
import type { CmsServiceContent } from "@/lib/cms/public-content";

type SuburbRecord = { suburb?: unknown };

export type ContactServiceOption = {
  group: "Services" | "Brand repairs";
  label: string;
};

const brandServiceSlugs = new Set([
  "tesla-approved-repair-centre",
  "services-zeekr-approved-repairer-melbourne",
  "byd-approved-repairer-melbourne",
  "lexus-approved-body-shop-melbourne",
]);

function cleanLabel(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

// This is the client-approved Melbourne-wide list used by the map. Keeping it
// here gives the contact form and map one source of truth without adding pages.
const suburbsByNormalisedName = new Map<string, string>();
for (const { suburb } of mapOnlySuburbs as SuburbRecord[]) {
  const label = cleanLabel(suburb);
  if (label) suburbsByNormalisedName.set(label.toLocaleLowerCase("en-AU"), label);
}

export const contactSuburbs = Array.from(suburbsByNormalisedName.values())
  .sort((left, right) => left.localeCompare(right, "en-AU", { sensitivity: "base" }));

export function getContactServiceOptions(services: CmsServiceContent[]): ContactServiceOption[] {
  const seen = new Set<string>();

  return services.reduce<ContactServiceOption[]>((options, service) => {
    const label = cleanLabel(service.placement.navigationLabel)
      || cleanLabel(service.placement.sliderLabel)
      || cleanLabel(service.title);
    const key = label.toLocaleLowerCase("en-AU");
    if (!label || seen.has(key)) return options;

    seen.add(key);
    options.push({
      group: brandServiceSlugs.has(service.slug) || service.presentation?.variant === "brand" ? "Brand repairs" : "Services",
      label,
    });
    return options;
  }, []);
}

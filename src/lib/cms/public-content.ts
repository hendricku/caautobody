import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { brandRepairContent, type BrandRepairContent } from "@/lib/brandRepairContent";
import { getEditorialServiceCopy, type OriginalServicePage } from "@/lib/originalServiceCopy";
import { blogs, faqs, gallery, locations, offers, services } from "@/lib/siteContent";
import { media } from "@/lib/media";
import { asServiceArrangement, orderByPreference, SERVICE_ARRANGEMENT_KEY } from "@/lib/cms/service-arrangement";
import type { BlogContent, FAQContent, GalleryContent, LocationContent, OfferContent, ServiceContent } from "@/types/content";

type PublicationStatus = "draft" | "published" | "retired";

export type ServicePresentation =
  | { variant: "editorial"; data: OriginalServicePage & { rightImage?: string } }
  | { variant: "brand"; data: BrandRepairContent & { rightImage?: string } }
  | { variant: "standard" };

export type ServicePlacement = {
  navigation: boolean;
  navigationLabel: string;
  navigationSummary: string;
  homeSlider: boolean;
  sliderLabel: string;
  sliderKicker: string;
  sliderCopy: string;
  sliderCta: string;
};

export type CmsServiceContent = ServiceContent & { presentation?: ServicePresentation; placement: ServicePlacement };
export type ServiceNavigationItem = { slug: string; label: string; summary: string };
export type ServiceCarouselItem = { label: string; kicker: string; title: string; image: string; copy: string; href: string; cta: string };

type CmsRow = Record<string, unknown>;

const defaultSiteSettings = {
  name: "CA Chelsea Autobody",
  phone: "03 9772 7411",
  phoneHref: "+61397727411",
  email: "info@caautobody.com.au",
  address: "7 Ashley Park Drive, Chelsea Heights, VIC 3196",
};

const defaultHomeHero = {
  eyebrow: "Melbourne's trusted smash repair specialists",
  title: "Quality repairs. Honest service.",
  accent: "Peace of mind.",
  description: "We make the smash repair process simple — from the first call and insurance support through to quality repair work and getting you safely back on the road.",
};

const navigationDefaults: Record<string, Pick<ServicePlacement, "navigationLabel" | "navigationSummary">> = {
  "accident-assistance": { navigationLabel: "Accident Assistance", navigationSummary: "Support after a collision" },
  "panel-beating": { navigationLabel: "Panel Beating", navigationSummary: "Structural and cosmetic repair" },
  "spray-painting": { navigationLabel: "Spray Painting", navigationSummary: "Precise colour matching" },
  "paintless-dent-removal": { navigationLabel: "Paintless Dent Removal", navigationSummary: "Low-impact dent repair" },
  "replacement-vehicles": { navigationLabel: "Replacement Vehicles", navigationSummary: "Keep moving while we repair" },
};

const carouselDefaults: Record<string, Omit<ServiceCarouselItem, "href">> = {
  "tesla-approved-repair-centre": { label: "Tesla Repair", kicker: "Tesla", title: "Tesla Repair", image: media.heroPanels.tesla, copy: "Specialist accident repair support for Tesla vehicles, with care for modern EV construction, finish and approved repair requirements.", cta: "Explore Tesla Repair" },
  "services-zeekr-approved-repairer-melbourne": { label: "Zeekr Repair", kicker: "Zeekr", title: "Zeekr Repair", image: media.heroPanels.zeekr, copy: "Approved repair support for Zeekr vehicles, with careful assessment, accurate colour matching and modern EV repair procedures.", cta: "Explore Zeekr Repair" },
  "byd-approved-repairer-melbourne": { label: "BYD Repair", kicker: "BYD", title: "BYD Repair", image: media.brandRepair.bydHero, copy: "Approved repair support for BYD vehicles, with EV-aware assessment, genuine parts planning and manufacturer-aligned procedures.", cta: "Explore BYD Repair" },
  "lexus-approved-body-shop-melbourne": { label: "Lexus Repair", kicker: "Lexus", title: "Lexus Repair", image: media.brandRepair.lexusHero, copy: "Approved Lexus collision repair with careful body accuracy, refinishing and genuine parts planning.", cta: "Explore Lexus Repair" },
  "prestige-brands": { label: "Prestige Brands", kicker: "Approved Expertise", title: "Prestige Brands", image: media.workshop.exteriorWide, copy: "Explore the services we offer for all prestige brands in all makes and models", cta: "All Services" },
  "panel-beating": { label: "Panel Beating", kicker: "Body Repair", title: "Panel Beating", image: media.service.panelBeating, copy: "Precision panel restoration for cosmetic damage through to more involved collision repairs.", cta: "Explore Panel Beating" },
  "spray-painting": { label: "Spray Painting", kicker: "Refinishing", title: "Spray Painting", image: media.service.sprayPainting, copy: "Professional refinishing with careful preparation, colour matching and controlled application.", cta: "Explore Spray Painting" },
  "replacement-vehicles": { label: "Replacement Vehicles", kicker: "Keep Moving", title: "Replacement Vehicles", image: media.service.replacementVehiclesCard, copy: "Practical mobility options to help keep your routine moving while your vehicle is being repaired.", cta: "Explore Replacement Vehicles" },
  "paintless-dent-removal": { label: "Paintless Dent Removal", kicker: "Dent Repair", title: "Paintless Dent Removal", image: media.service.paintlessDent, copy: "A low-impact approach for suitable dents that helps preserve the vehicle’s existing paint finish.", cta: "Explore PDR" },
  "accident-assistance": { label: "Accident Assistance", kicker: "Support", title: "Accident Assistance", image: media.service.accident, copy: "Clear support after an accident, from repair planning and towing guidance to insurer coordination.", cta: "Explore Accident Assistance" },
};

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

function record(value: unknown): CmsRow | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as CmsRow : null;
}

function placement(value: unknown, slug: string): ServicePlacement {
  const configured = record(record(value)?.placement);
  const navigation = navigationDefaults[slug];
  const slider = carouselDefaults[slug];
  const string = (key: keyof ServicePlacement, fallback = "") => typeof configured?.[key] === "string" ? configured[key] as string : fallback;
  return {
    navigation: typeof configured?.navigation === "boolean" ? configured.navigation : Boolean(navigation),
    navigationLabel: string("navigationLabel", navigation?.navigationLabel || ""),
    navigationSummary: string("navigationSummary", navigation?.navigationSummary || ""),
    homeSlider: typeof configured?.homeSlider === "boolean" ? configured.homeSlider : Boolean(slider),
    sliderLabel: string("sliderLabel", slider?.label || ""),
    sliderKicker: string("sliderKicker", slider?.kicker || ""),
    sliderCopy: string("sliderCopy", slider?.copy || ""),
    sliderCta: string("sliderCta", slider?.cta || ""),
  };
}

function staticPresentation(slug: string): ServicePresentation {
  const editorial = getEditorialServiceCopy(slug);
  if (editorial) return { variant: "editorial", data: editorial };
  const brand = brandRepairContent[slug];
  if (brand) return { variant: "brand", data: brand };
  return { variant: "standard" };
}

// CMS migrations deliberately kept legacy brand copy in code. Both the public
// renderer and the admin editor use this resolver, so older records remain
// editable without silently writing a migration over their original row.
export function resolveServicePresentation(value: unknown, slug: string): ServicePresentation {
  const content = record(value);
  const variant = content?.variant;
  const data = record(content?.data);
  if (variant === "editorial" && data && typeof data.title === "string") return { variant, data: data as unknown as OriginalServicePage };
  if (variant === "brand" && data && typeof data.title === "string") return { variant, data: data as unknown as BrandRepairContent };
  if (variant === "standard") return { variant };
  return staticPresentation(slug);
}

export function mapService(row: CmsRow): CmsServiceContent {
  const slug = asString(row.slug);
  return {
    slug,
    title: asString(row.title),
    seoTitle: asString(row.seo_title),
    eyebrow: asString(row.eyebrow),
    intro: asString(row.intro),
    body: asStringArray(row.body),
    image: asString(row.image_path),
    highlights: asStringArray(row.highlights),
    contentPending: Boolean(row.content_pending),
    presentation: resolveServicePresentation(row.content_json, slug),
    placement: placement(row.content_json, slug),
  };
}

export function mapLocation(row: CmsRow): LocationContent {
  const coordinates = Array.isArray(row.coordinates) && row.coordinates.length === 2
    ? [Number(row.coordinates[0]), Number(row.coordinates[1])] as [number, number]
    : [0, 0] as [number, number];
  return {
    slug: asString(row.slug), name: asString(row.name), seoTitle: asString(row.seo_title), intro: asString(row.intro),
    body: asStringArray(row.body), image: asString(row.image_path), coordinates, mapDescription: asString(row.map_description),
  };
}

export function mapOffer(row: CmsRow): OfferContent {
  return {
    slug: asString(row.slug), title: asString(row.title), seoTitle: asString(row.seo_title), eyebrow: asString(row.eyebrow),
    intro: asString(row.intro), body: asStringArray(row.body), image: asString(row.image_path), bullets: asStringArray(row.bullets),
  };
}

function mapBlog(row: CmsRow): BlogContent {
  const category = row.category === "Client Stories" ? "Client Stories" : "CA Knows";
  const status: PublicationStatus = row.status === "draft" || row.status === "retired" ? row.status : "published";
  return {
    slug: asString(row.slug), title: asString(row.title), date: asString(row.display_date), category,
    excerpt: asString(row.excerpt), image: asString(row.image_path), status: status === "retired" ? "draft" : status,
    blocks: Array.isArray(row.blocks) ? row.blocks as BlogContent["blocks"] : undefined,
  };
}

export function mapFaq(row: CmsRow): FAQContent {
  return { id: asString(row.legacy_key), category: asString(row.category), question: asString(row.question), answer: asString(row.answer), visible: Boolean(row.is_visible), status: asString(row.status) as FAQContent["status"] };
}

export function mapGallery(row: CmsRow): GalleryContent {
  return { id: asString(row.legacy_key), image: asString(row.image_path), caption: asString(row.caption), category: asString(row.category), status: asString(row.status) as GalleryContent["status"] };
}

async function readRows<T>(table: string, fallback: T[], mapper: (row: CmsRow) => T): Promise<T[]> {
  const client = publicClient();
  if (!client) return fallback;

  const { data, error } = await client.from(table).select("*").eq("status", "published").order("sort_order", { ascending: true });
  if (error || !data) {
    // A static fallback keeps the website available during an outage, but
    // logging ensures the CMS/public mismatch is visible in server logs.
    console.error("Public CMS collection read failed; serving static fallback", { table, code: error?.code });
    return fallback;
  }
  return (data as CmsRow[]).map(mapper);
}

export const getPublishedServiceArrangement = cache(async () => {
  const client = publicClient();
  if (!client) return null;
  const { data, error } = await client.from("cms_site_settings").select("value")
    .eq("key", SERVICE_ARRANGEMENT_KEY).eq("is_public", true).maybeSingle();
  if (error) { console.error("CMS published service arrangement unavailable", { code: error.code }); return null; }
  return asServiceArrangement(data?.value);
});

export const getPublishedServices = cache(async (): Promise<CmsServiceContent[]> =>
  readRows("cms_services", services.map((item) => ({ ...item, presentation: staticPresentation(item.slug), placement: placement(undefined, item.slug) })), mapService),
);

export const getPublishedServiceNavigation = cache(async (): Promise<ServiceNavigationItem[]> => {
  const [published, arrangement] = await Promise.all([getPublishedServices(), getPublishedServiceArrangement()]);
  const items = published.filter((service) => service.placement.navigation);
  return orderByPreference(items, arrangement?.menu, (service) => service.slug)
    .map((service) => ({ slug: service.slug, label: service.placement.navigationLabel || service.title, summary: service.placement.navigationSummary || service.intro }));
});

export const getPublishedServiceCarousel = cache(async (): Promise<ServiceCarouselItem[]> => {
  const [published, arrangement] = await Promise.all([getPublishedServices(), getPublishedServiceArrangement()]);
  const order = Object.keys(carouselDefaults);
  const configured = published
    .filter((service) => service.placement.homeSlider)
    .map((service, sourceIndex) => {
      const fallback = carouselDefaults[service.slug];
      return {
        label: service.placement.sliderLabel || fallback?.label || service.title,
        kicker: service.placement.sliderKicker || fallback?.kicker || service.eyebrow || "CA Autobody service",
        title: service.title || fallback?.title || "",
        image: service.image || fallback?.image || "",
        copy: service.placement.sliderCopy || fallback?.copy || service.intro,
        href: `/services/${service.slug}`,
        cta: service.placement.sliderCta || fallback?.cta || `Explore ${service.title}`,
        sourceIndex,
      };
    });
  // Keep the existing Prestige directory slide until a published service with
  // that slug exists. A future CMS entry then replaces this static fallback.
  if (!configured.some((item) => item.href === "/services/prestige-brands") &&
      (!arrangement || arrangement.slider.includes("prestige-brands"))) {
    const prestige = carouselDefaults["prestige-brands"];
    configured.push({ ...prestige, href: "/services", sourceIndex: 4 });
  }
  const position = (item: (typeof configured)[number]) => {
    const slug = item.href === "/services" ? "prestige-brands" : item.href.split("/").pop() || "";
    const index = order.indexOf(slug);
    return index === -1 ? 1000 : index;
  };
  const sorted = arrangement ? orderByPreference(configured, arrangement.slider, (item) => item.href === "/services" ? "prestige-brands" : item.href.split("/").pop() || "") :
    configured.sort((left, right) => position(left) - position(right) || left.sourceIndex - right.sourceIndex);
  return sorted.map((item) => ({ label: item.label, kicker: item.kicker, title: item.title, image: item.image, copy: item.copy, href: item.href, cta: item.cta }));
});

export const getPublishedLocations = cache(async () => readRows("cms_locations", locations, mapLocation));
export const getPublishedOffers = cache(async () => readRows("cms_offers", offers, mapOffer));
export const getPublishedBlogs = cache(async () => readRows("cms_blog_posts", blogs, mapBlog));
export const getPublishedFaqs = cache(async () => {
  const rows = await readRows("cms_faqs", faqs.filter((item) => !/^(byd|lexus)-question-/.test(item.id)), mapFaq);
  return rows.filter((item) => !/^(byd|lexus)-question-/.test(item.id));
});
export const getPublishedGallery = cache(async () => readRows("cms_gallery_items", gallery, mapGallery));

export const getPublicSiteSettings = cache(async () => {
  const client = publicClient();
  if (!client) return defaultSiteSettings;

  const { data, error } = await client
    .from("cms_site_settings")
    .select("value")
    .eq("key", "site")
    .eq("is_public", true)
    .maybeSingle();

  if (error) return defaultSiteSettings;
  const value = record(data?.value);
  return {
    name: asString(value?.name, defaultSiteSettings.name),
    phone: asString(value?.phone, defaultSiteSettings.phone),
    phoneHref: asString(value?.phoneHref, defaultSiteSettings.phoneHref),
    email: asString(value?.email, defaultSiteSettings.email),
    address: asString(value?.address, defaultSiteSettings.address),
  };
});

export const getPublishedHomeHero = cache(async () => {
  const client = publicClient();
  if (!client) return defaultHomeHero;

  const { data, error } = await client
    .from("cms_page_sections")
    .select("content")
    .eq("page_key", "home")
    .eq("section_key", "hero")
    .eq("status", "published")
    .maybeSingle();

  if (error) return defaultHomeHero;
  const content = record(data?.content);
  return {
    eyebrow: asString(content?.eyebrow, defaultHomeHero.eyebrow),
    title: asString(content?.title, defaultHomeHero.title),
    accent: asString(content?.accent, defaultHomeHero.accent),
    description: asString(content?.description, defaultHomeHero.description),
  };
});

export const getPublishedServiceBySlug = cache(async (slug: string) => (await getPublishedServices()).find((item) => item.slug === slug));
export const getPublishedLocationBySlug = cache(async (slug: string) => (await getPublishedLocations()).find((item) => item.slug === slug));
export const getPublishedOfferBySlug = cache(async (slug: string) => (await getPublishedOffers()).find((item) => item.slug === slug));
export const getPublishedBlogBySlug = cache(async (slug: string) => (await getPublishedBlogs()).find((item) => item.slug === slug));

import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { brandRepairContent, type BrandRepairContent } from "@/lib/brandRepairContent";
import { getEditorialServiceCopy, type OriginalServicePage } from "@/lib/originalServiceCopy";
import { blogs, faqs, gallery, locations, offers, services } from "@/lib/siteContent";
import type { BlogContent, FAQContent, GalleryContent, LocationContent, OfferContent, ServiceContent } from "@/types/content";

type PublicationStatus = "draft" | "published" | "retired";

export type ServicePresentation =
  | { variant: "editorial"; data: OriginalServicePage }
  | { variant: "brand"; data: BrandRepairContent }
  | { variant: "standard" };

export type CmsServiceContent = ServiceContent & { presentation?: ServicePresentation };

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

function staticPresentation(slug: string): ServicePresentation {
  const editorial = getEditorialServiceCopy(slug);
  if (editorial) return { variant: "editorial", data: editorial };
  const brand = brandRepairContent[slug];
  if (brand) return { variant: "brand", data: brand };
  return { variant: "standard" };
}

function presentation(value: unknown, slug: string): ServicePresentation {
  const content = record(value);
  const variant = content?.variant;
  const data = record(content?.data);
  if (variant === "editorial" && data) return { variant, data: data as unknown as OriginalServicePage };
  if (variant === "brand" && data) return { variant, data: data as unknown as BrandRepairContent };
  if (variant === "standard") return { variant };
  return staticPresentation(slug);
}

function mapService(row: CmsRow): CmsServiceContent {
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
    presentation: presentation(row.content_json, slug),
  };
}

function mapLocation(row: CmsRow): LocationContent {
  const coordinates = Array.isArray(row.coordinates) && row.coordinates.length === 2
    ? [Number(row.coordinates[0]), Number(row.coordinates[1])] as [number, number]
    : [0, 0] as [number, number];
  return {
    slug: asString(row.slug), name: asString(row.name), seoTitle: asString(row.seo_title), intro: asString(row.intro),
    body: asStringArray(row.body), image: asString(row.image_path), coordinates, mapDescription: asString(row.map_description),
  };
}

function mapOffer(row: CmsRow): OfferContent {
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

function mapFaq(row: CmsRow): FAQContent {
  return { id: asString(row.legacy_key), category: asString(row.category), question: asString(row.question), answer: asString(row.answer), visible: Boolean(row.is_visible) };
}

function mapGallery(row: CmsRow): GalleryContent {
  return { id: asString(row.legacy_key), image: asString(row.image_path), caption: asString(row.caption), category: asString(row.category) };
}

async function readRows<T>(table: string, fallback: T[], mapper: (row: CmsRow) => T): Promise<T[]> {
  const client = publicClient();
  if (!client) return fallback;

  const { data, error } = await client.from(table).select("*").eq("status", "published").order("sort_order", { ascending: true });
  if (error || !data) return fallback;
  return (data as CmsRow[]).map(mapper);
}

export const getPublishedServices = cache(async (): Promise<CmsServiceContent[]> =>
  readRows("cms_services", services.map((item) => ({ ...item, presentation: staticPresentation(item.slug) })), mapService),
);

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

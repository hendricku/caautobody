import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { copySlug, duplicateInput, type DuplicateCollection } from "@/lib/cms/content-duplicate";
import { CMS_IMAGE_FORMATS, formatFromStagingPath, isSafeCmsImageReference, normaliseCmsImageReference, stagingPathFromReference } from "@/lib/cms/image-reference";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

const allowed = {
  blogs: { table: "cms_blog_posts", key: "slug", path: "/blog" },
  services: { table: "cms_services", key: "slug", path: "/services" },
  faqs: { table: "cms_faqs", key: "legacy_key", path: "/frequently-asked-questions" },
  gallery: { table: "cms_gallery_items", key: "legacy_key", path: "/gallery" },
  offers: { table: "cms_offers", key: "slug", path: "/offers" },
  areas: { table: "cms_locations", key: "slug", path: "/areas-we-serve" },
} as const;
type Collection = keyof typeof allowed;
function config(collection: string) { return allowed[collection as Collection] || null; }
const duplicateRequestSchema = z.object({ sourceId: z.string().trim().min(1).max(140) }).strict();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const str = (value: unknown, max = 10000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const normaliseImage = normaliseCmsImageReference;
const safeImage = isSafeCmsImageReference;
const arr = (value: unknown) => Array.isArray(value) && value.length <= 200 && value.every((x) => typeof x === "string" && x.length < 10000) ? value : [];
function shapeBlocks(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value) || value.length > 250) return null;
  const blocks: Record<string, unknown>[] = [];
  for (const [index, raw] of value.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const block = raw as Record<string, unknown>;
    // Normalize legacy labels so an older article can be edited instead of
    // making every valid new block fail the complete save operation.
    const legacyType = block.type === "paragraph" ? "text" : block.type === "bullets" ? "list" : block.type;
    if (!(["heading", "text", "callout", "image", "list"] as const).includes(legacyType as "heading" | "text" | "callout" | "image" | "list")) return null;
    const type = legacyType as "heading" | "text" | "callout" | "image" | "list";
    const image = normaliseImage(block.image ?? block.image_path);
    if (type === "image" && (!image || !safeImage(image))) return null;
    if (type === "list" && block.items !== undefined && !Array.isArray(block.items)) return null;
    blocks.push({
      id: str(block.id, 100) || `legacy-${index}-${type}`,
      type,
      content: str(block.content ?? block.text, 20000),
      image,
      alt: str(block.alt, 500),
      caption: str(block.caption, 1000),
      placement: block.placement === "lead" ? "lead" : "full",
      ordered: Boolean(block.ordered),
      items: Array.isArray(block.items) ? block.items.slice(0, 100).map((item) => ({ content: str(item && typeof item === "object" ? (item as { content?: unknown }).content : item, 5000) })) : [],
    });
  }
  return blocks;
}
function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function servicePlacement(value: unknown, slug: unknown) {
  const configured = object(object(value)?.placement);
  const key = str(slug, 120);
  const navigationDefaults = new Set(["accident-assistance", "panel-beating", "spray-painting", "paintless-dent-removal", "replacement-vehicles"]);
  const sliderDefaults = new Set(["tesla-approved-repair-centre", "services-zeekr-approved-repairer-melbourne", "byd-approved-repairer-melbourne", "lexus-approved-body-shop-melbourne", "panel-beating", "spray-painting", "replacement-vehicles", "paintless-dent-removal", "accident-assistance"]);
  return {
    navigation: typeof configured?.navigation === "boolean" ? configured.navigation : navigationDefaults.has(key),
    navigationLabel: str(configured?.navigationLabel, 100),
    navigationSummary: str(configured?.navigationSummary, 240),
    homeSlider: typeof configured?.homeSlider === "boolean" ? configured.homeSlider : sliderDefaults.has(key),
    sliderLabel: str(configured?.sliderLabel, 100),
    sliderKicker: str(configured?.sliderKicker, 100),
    sliderCopy: str(configured?.sliderCopy, 600),
    sliderCta: str(configured?.sliderCta, 100),
  };
}
function servicePresentation(value: unknown) {
  const content = object(value);
  if (!content) return { variant: "standard" };
  return Object.fromEntries(Object.entries(content).filter(([key]) => key !== "placement"));
}
function validServicePresentation(value: unknown): Record<string, unknown> | null {
  const presentation = object(value) || { variant: "standard" };
  let serialized = "";
  try { serialized = JSON.stringify(presentation); } catch { return null; }
  if (serialized.length > 200000) return null;
  if (presentation.variant === "standard") return { variant: "standard" };
  if (presentation.variant !== "editorial" && presentation.variant !== "brand") return null;
  const data = object(presentation.data);
  if (!data || !str(data.title, 300)) return null;
  if (presentation.variant === "editorial") {
    if (!Array.isArray(data.introParagraphs) || !Array.isArray(data.sections) || data.sections.length > 80) return null;
    if (!data.sections.every((section) => {
      const item = object(section);
      return Boolean(item && str(item.heading, 300) && Array.isArray(item.blocks) && item.blocks.length <= 120 && item.blocks.every((block) => {
        const entry = object(block);
        return Boolean(entry && ["paragraph", "subheading", "bullet"].includes(str(entry.type, 30)) && str(entry.text, 20000));
      }));
    })) return null;
  }
  if (presentation.variant === "brand") {
    for (const key of ["pillars", "principles", "capabilities", "process", "faqs", "media"]) if (!Array.isArray(data[key]) || data[key].length > 80) return null;
    if (!object(data.sections) || !object(data.review)) return null;
    if (![data.heroImage, data.logo].every((image) => safeImage(normaliseImage(image)))) return null;
    if (!(data.media as unknown[]).every((item) => safeImage(normaliseImage(object(item)?.image)))) return null;
  }
  return { variant: presentation.variant, data };
}
function mapRow(collection: Collection, row: Record<string, unknown>) {
  if (collection === "blogs") return { slug: row.slug, title: row.title, date: row.display_date, category: row.category, excerpt: row.excerpt, image: row.image_path, status: row.status, blocks: row.blocks };
  if (collection === "services") return { slug: row.slug, title: row.title, seoTitle: row.seo_title, eyebrow: row.eyebrow, intro: row.intro, body: row.body, image: row.image_path, highlights: row.highlights, contentPending: row.content_pending, presentation: servicePresentation(row.content_json), placement: servicePlacement(row.content_json, row.slug), status: row.status };
  if (collection === "faqs") return { id: row.legacy_key, category: row.category, question: row.question, answer: row.answer, visible: row.is_visible, status: row.status };
  if (collection === "gallery") return { id: row.legacy_key, image: row.image_path, caption: row.caption, category: row.category, status: row.status };
  if (collection === "offers") return { slug: row.slug, title: row.title, seoTitle: row.seo_title, eyebrow: row.eyebrow, intro: row.intro, body: row.body, image: row.image_path, bullets: row.bullets, status: row.status };
  return { slug: row.slug, name: row.name, seoTitle: row.seo_title, intro: row.intro, body: row.body, image: row.image_path, coordinates: row.coordinates, mapDescription: row.map_description, status: row.status };
}
function toRow(collection: Collection, input: Record<string, unknown>): Record<string, unknown> | null {
  const status = input.status === "published" ? "published" : "draft";
  const slug = str(input.slug, 120);
  const id = str(input.id, 140);
  const image = normaliseImage(input.image);
  if (!safeImage(image)) return null;
  const basic = { status };
  if (collection === "blogs") {
    const blocks = shapeBlocks(input.blocks);
    if (!slugPattern.test(slug) || !str(input.title,200) || blocks === null) return null;
    return { ...basic, slug, legacy_key: `admin-blog-${slug}`, title: str(input.title,300), category: input.category === "Client Stories" ? "Client Stories" : "CA Knows", display_date: str(input.date,100), excerpt: str(input.excerpt,2000), image_path: image, blocks };
  }
  if (collection === "faqs") { if (!id || !str(input.question)) return null; return { ...basic, legacy_key: id, category: str(input.category,120), question: str(input.question,500), answer: str(input.answer,10000), is_visible: Boolean(input.visible) }; }
  if (collection === "gallery") { if (!id || !image) return null; return { ...basic, legacy_key: id, image_path: image, caption: str(input.caption,500), category: str(input.category,120) }; }
  if (!slugPattern.test(slug)) return null;
  if (collection === "services") {
    const presentation = validServicePresentation(input.presentation);
    if (!presentation) return null;
    const rawPlacement = object(input.placement) || {};
    const placement = { navigation: Boolean(rawPlacement.navigation), navigationLabel: str(rawPlacement.navigationLabel, 100), navigationSummary: str(rawPlacement.navigationSummary, 240), homeSlider: Boolean(rawPlacement.homeSlider), sliderLabel: str(rawPlacement.sliderLabel, 100), sliderKicker: str(rawPlacement.sliderKicker, 100), sliderCopy: str(rawPlacement.sliderCopy, 600), sliderCta: str(rawPlacement.sliderCta, 100) };
    return { ...basic, content_json: { ...presentation, placement }, legacy_key: `admin-service-${slug}`, slug, title: str(input.title,300), seo_title: str(input.seoTitle,300), eyebrow: str(input.eyebrow,200), intro: str(input.intro,3000), body: arr(input.body), image_path: image, highlights: arr(input.highlights), content_pending: Boolean(input.contentPending) };
  }
  if (collection === "offers") return { ...basic, legacy_key: `admin-offer-${slug}`, slug, title: str(input.title,300), seo_title: str(input.seoTitle,300), eyebrow: str(input.eyebrow,200), intro: str(input.intro,3000), body: arr(input.body), image_path: image, bullets: arr(input.bullets) };
  return { ...basic, legacy_key: `admin-area-${slug}`, slug, name: str(input.name,300), seo_title: str(input.seoTitle,300), intro: str(input.intro,3000), body: arr(input.body), image_path: image, coordinates: Array.isArray(input.coordinates) && input.coordinates.length === 2 && input.coordinates.every((n) => typeof n === "number" && Number.isFinite(n)) ? input.coordinates : [0,0], map_description: str(input.mapDescription,3000) };
}
async function promoteImage(image: string, admin: NonNullable<Awaited<ReturnType<typeof getAdmin>>>): Promise<string> {
  if (!image.startsWith("/api/admin/media?path=")) return image;
  if (admin.role === "editor") throw new Error("Only publishers may publish images");
  const path = stagingPathFromReference(image);
  if (!path) throw new Error("Invalid staging media path");
  const format = formatFromStagingPath(path);
  if (!format) throw new Error("Unsupported staging media type");
  const spec = CMS_IMAGE_FORMATS[format];
  const { data: file, error: readError } = await admin.client.storage.from("cms-staging").download(path);
  if (readError || !file) throw new Error("Staging image not available");
  const publishedPath = "published/" + crypto.randomUUID() + "." + spec.extension;
  const { error: uploadError } = await admin.client.storage.from("cms-public").upload(publishedPath, file, { contentType: spec.contentType, upsert: false });
  if (uploadError) throw new Error(`Image promotion failed: ${uploadError.message}`);
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cms-public/${publishedPath}`;
}
async function promoteServicePresentationImages(value: Record<string, unknown>, admin: NonNullable<Awaited<ReturnType<typeof getAdmin>>>) {
  const presentation = object(value);
  const data = object(presentation?.data);
  if (!presentation || presentation.variant !== "brand" || !data) return value;
  const media = Array.isArray(data.media) ? await Promise.all(data.media.map(async (item) => {
    const entry = object(item);
    return entry ? { ...entry, image: await promoteImage(normaliseImage(entry.image), admin) } : item;
  })) : [];
  return { ...presentation, data: { ...data, heroImage: await promoteImage(normaliseImage(data.heroImage), admin), logo: await promoteImage(normaliseImage(data.logo), admin), media } };
}
function invalid(message = "Invalid CMS content. Check the title, slug, image URL and content blocks, then try again.") { return NextResponse.json({ error: message }, { status: 400 }); }
function blogValidationError(input: Record<string, unknown>) {
  if (!slugPattern.test(str(input.slug, 120))) return "A valid article slug is required.";
  if (!str(input.title, 200)) return "An article title is required.";
  if (!safeImage(normaliseImage(input.image))) return "The featured image must be a WebP upload, an /images path, or a valid HTTPS image URL.";
  if (!Array.isArray(input.blocks)) return "The article content blocks are missing. Reload the editor and try again.";
  if (input.blocks.length > 250) return "This article has too many content blocks.";
  for (const [index, raw] of input.blocks.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return `Content block ${index + 1} is invalid.`;
    const block = raw as Record<string, unknown>;
    const type = block.type === "paragraph" ? "text" : block.type === "bullets" ? "list" : block.type;
    if (!(["heading", "text", "callout", "image", "list"] as const).includes(type as "heading" | "text" | "callout" | "image" | "list")) return `Content block ${index + 1} has an unsupported type.`;
    if (type === "image" && !normaliseImage(block.image ?? block.image_path)) return `Image block ${index + 1} needs an image. Upload a WebP file or paste an image URL.`;
    if (type === "image" && !safeImage(normaliseImage(block.image ?? block.image_path))) return `Image block ${index + 1} needs a WebP upload, an /images path, or a valid HTTPS image URL.`;
  }
  return null;
}
function databaseFailure(area: string, code?: string) {
  console.error("CMS database failure", { area, code });
  return NextResponse.json({ error: "The CMS is temporarily unavailable. Please try again." }, { status: 503 });
}
function revalidateCollection(collection: Collection, originalId?: string, nextSlug?: string) {
  const cfg = allowed[collection];
  revalidatePath(cfg.path);
  // Services also feed the global header menu and the homepage carousel.
  // Revalidate the root layout so placement changes reach every public route.
  if (collection === "services") revalidatePath("/", "layout");
  if (cfg.key === "slug") {
    if (originalId) revalidatePath(`${cfg.path}/${originalId}`);
    if (nextSlug) revalidatePath(`${cfg.path}/${nextSlug}`);
  }
  revalidatePath("/sitemap.xml");
}
export async function GET(_request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const collection = (await params).collection as Collection;
  const cfg = config(collection);
  if (!cfg) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const admin = await getAdmin(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items: Record<string,unknown>[] = [];
  for (let offset=0; ; offset+=250) {
    const { data, error } = await admin.client.from(cfg.table).select("*").neq("status", "retired").order("sort_order", { ascending: true }).order("id", { ascending: true }).range(offset,offset+249);
    if (error) return databaseFailure(`${collection}:read`, error.code);
    items.push(...(data || [])); if (!data || data.length < 250) break;
  }
  return NextResponse.json({ items: items.map((row) => mapRow(collection, row)), role: admin.role }, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const collection = (await params).collection as Collection;
  const cfg = config(collection); if (!cfg) return invalid();
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const admin = await getAdmin(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.item || typeof body.item !== "object") return invalid();
  if (collection === "blogs") {
    const error = blogValidationError(body.item as Record<string, unknown>);
    if (error) return invalid(error);
  }
  const row = toRow(collection, body.item); if (!row) return invalid();
  if (row.status === "published") {
    try {
      if (typeof row.image_path === "string") row.image_path = await promoteImage(row.image_path, admin);
      if (collection === "services" && object(row.content_json)) row.content_json = await promoteServicePresentationImages(row.content_json as Record<string, unknown>, admin);
      if (collection === "blogs" && Array.isArray(row.blocks)) {
        const promoted = [];
        for (const block of row.blocks) {
          promoted.push(block.type === "image" ? { ...block, image: await promoteImage(block.image, admin) } : block);
        }
        row.blocks = promoted;
      }
    } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Media validation failed" }, { status: 400 }); }
  }
  if (row.status === "published" && admin.role === "editor") return NextResponse.json({ error: "Publishing requires Publisher or Admin permissions" }, { status: 403 });
  const originalId = str(body.originalId || body.item[cfg.key === "slug" ? "slug" : "id"],140);
  const { data: existing, error: lookupError } = originalId ? await admin.client.from(cfg.table).select("id,status,legacy_key").eq(cfg.key, originalId).maybeSingle() : { data: null, error: null };
  if (lookupError) return databaseFailure(`${collection}:lookup`, lookupError.code);
  // Legacy screens may omit status. Preserve publication rather than silently unpublishing edits.
  if (existing && body.item.status === undefined) row.status = existing.status;
  if (existing && admin.role === "editor" && existing.status !== "draft") return NextResponse.json({ error: "Editors can only modify drafts" }, { status: 403 });
  const values = existing ? Object.fromEntries(Object.entries(row).filter(([name]) => name !== "legacy_key")) : row;
  const action = existing ? admin.client.from(cfg.table).update(values).eq("id", existing.id) : admin.client.from(cfg.table).insert(values);
  const { data, error } = await action.select().single();
  if (error) return databaseFailure(`${collection}:save`, error.code);
  revalidateCollection(collection, originalId, str(row.slug));
  return NextResponse.json({ item: mapRow(collection, data) });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const collection = (await params).collection as Collection;
  const cfg = config(collection);
  if (!cfg) return invalid();
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  let duplicateRequest: z.infer<typeof duplicateRequestSchema>;
  try { duplicateRequest = duplicateRequestSchema.parse(await request.json()); }
  catch { return invalid("Select a CMS item to duplicate."); }

  try {
    const permitted = await consumePublicRateLimit({ request, scope: "cms-duplicate", limit: 30, windowSeconds: 60 });
    if (!permitted) return NextResponse.json({ error: "Too many duplicate requests. Please wait a minute and try again." }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "The CMS is temporarily unavailable. Please try again." }, { status: 503 });
  }

  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: source, error: sourceError } = await admin.client
    .from(cfg.table)
    .select("*")
    .eq(cfg.key, duplicateRequest.sourceId)
    .neq("status", "retired")
    .maybeSingle();
  if (sourceError) return databaseFailure(`${collection}:duplicate-source`, sourceError.code);
  if (!source) return NextResponse.json({ error: "CMS record not found" }, { status: 404 });

  const sourceItem = mapRow(collection, source) as Record<string, unknown>;
  const sourceSortOrder = typeof source.sort_order === "number" && Number.isSafeInteger(source.sort_order) ? source.sort_order : 0;
  const maxAttempts = cfg.key === "slug" ? 100 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const nextSlug = cfg.key === "slug" ? copySlug(str(source.slug, 120), attempt) : undefined;
    if (nextSlug) {
      const { data: collision, error: collisionError } = await admin.client.from(cfg.table).select("id").eq("slug", nextSlug).limit(1);
      if (collisionError) return databaseFailure(`${collection}:duplicate-slug`, collisionError.code);
      if (collision && collision.length > 0) continue;
    }

    const input = duplicateInput(collection as DuplicateCollection, sourceItem, nextSlug);
    const row = toRow(collection, input);
    if (!row) return invalid("The selected content cannot be duplicated because it no longer passes CMS validation.");
    row.sort_order = sourceSortOrder;
    const { data, error } = await admin.client.from(cfg.table).insert(row).select().single();
    if (!error) {
      revalidateCollection(collection, undefined, nextSlug);
      return NextResponse.json({ item: mapRow(collection, data) }, { status: 201 });
    }
    // Slugs are uniquely constrained in the database. Retrying also handles a
    // concurrent duplicate request that claims the candidate after our lookup.
    if (cfg.key === "slug" && error.code === "23505") continue;
    return databaseFailure(`${collection}:duplicate`, error.code);
  }
  return NextResponse.json({ error: "Unable to create a unique draft URL. Please try again." }, { status: 409 });
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const collection = (await params).collection as Collection; const cfg = config(collection);
  if (!cfg) return invalid();
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const admin = await getAdmin(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role === "editor") return NextResponse.json({ error: "Only publishers can retire content" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = str(body?.id,140); if (!id) return invalid();
  const { data, error } = await admin.client.from(cfg.table).update({ status: "retired" }).eq(cfg.key,id).select("id").maybeSingle();
  if (error) return databaseFailure(`${collection}:retire`, error.code);
  if (!data) return NextResponse.json({ error: "CMS record not found" }, { status: 404 });
  revalidateCollection(collection, id);
  return NextResponse.json({ ok: true });
}

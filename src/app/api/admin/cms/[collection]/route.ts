import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { CMS_IMAGE_FORMATS, formatFromStagingPath, isSafeCmsImageReference, normaliseCmsImageReference, stagingPathFromReference } from "@/lib/cms/image-reference";

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
function mapRow(collection: Collection, row: Record<string, unknown>) {
  if (collection === "blogs") return { slug: row.slug, title: row.title, date: row.display_date, category: row.category, excerpt: row.excerpt, image: row.image_path, status: row.status, blocks: row.blocks };
  if (collection === "services") return { slug: row.slug, title: row.title, seoTitle: row.seo_title, eyebrow: row.eyebrow, intro: row.intro, body: row.body, image: row.image_path, highlights: row.highlights, contentPending: row.content_pending, presentation: row.content_json, status: row.status };
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
  if (collection === "services") return { ...basic, content_json: input.presentation && typeof input.presentation === "object" && !Array.isArray(input.presentation) && JSON.stringify(input.presentation).length < 200000 ? input.presentation : {variant:"standard"}, legacy_key: `admin-service-${slug}`, slug, title: str(input.title,300), seo_title: str(input.seoTitle,300), eyebrow: str(input.eyebrow,200), intro: str(input.intro,3000), body: arr(input.body), image_path: image, highlights: arr(input.highlights), content_pending: Boolean(input.contentPending) };
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
  revalidatePath(cfg.path);
  if (cfg.key === "slug") { if (originalId) revalidatePath(`${cfg.path}/${originalId}`); revalidatePath(`${cfg.path}/${str(row.slug)}`); }
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ item: mapRow(collection, data) });
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
  revalidatePath(cfg.path); if (cfg.key === "slug") revalidatePath(`${cfg.path}/${id}`);
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true });
}

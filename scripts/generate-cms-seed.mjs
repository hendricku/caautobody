import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const moduleCache = new Map();

function resolveImport(specifier, fromFile) {
  if (specifier.startsWith("@/")) return resolve(root, "src", `${specifier.slice(2)}.ts`);
  if (specifier.startsWith(".")) return resolve(resolve(fromFile, ".."), `${specifier}.ts`);
  throw new Error(`Unsupported seed-generator import: ${specifier}`);
}

function loadTypeScript(file) {
  const fullPath = resolve(file);
  if (moduleCache.has(fullPath)) return moduleCache.get(fullPath);
  const source = readFileSync(fullPath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: fullPath,
  }).outputText;
  const module = { exports: {} };
  moduleCache.set(fullPath, module.exports);
  const localRequire = (specifier) => loadTypeScript(resolveImport(specifier, fullPath));
  vm.runInNewContext(compiled, { module, exports: module.exports, require: localRequire, console }, { filename: fullPath });
  moduleCache.set(fullPath, module.exports);
  return module.exports;
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function json(value) {
  return `${quote(JSON.stringify(value))}::jsonb`;
}

function mimeType(file) {
  return { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" }[extname(file).toLowerCase()] ?? "application/octet-stream";
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function insert(table, columns, values, conflict) {
  return `insert into public.${table} (${columns.join(", ")}) values\n${values.map((row) => `  (${row.join(", ")})`).join(",\n")}\non conflict (${conflict}) do nothing;\n`;
}

const { services, locations, offers, blogs, faqs, gallery, site } = loadTypeScript(join(root, "src/lib/siteContent.ts"));
const { originalServiceCopy } = loadTypeScript(join(root, "src/lib/originalServiceCopy.ts"));
const { brandRepairContent } = loadTypeScript(join(root, "src/lib/brandRepairContent.ts"));

const retiredFaq = /^(byd|lexus)-question-/;
// Historical retirement archive is intentionally separate from the active FAQ source.
const historicalRetiredFaqs = JSON.parse(readFileSync(join(root, "reference/retired-faqs.json"), "utf8"));
const allFaqs = [...faqs, ...historicalRetiredFaqs];
const serviceRows = services.map((item, index) => {
  const presentation = originalServiceCopy[item.slug]
    ? { variant: "editorial", data: originalServiceCopy[item.slug] }
    : brandRepairContent[item.slug]
      ? { variant: "brand", data: brandRepairContent[item.slug] }
      : { variant: "standard" };
  return [quote(item.slug), quote(item.slug), quote(item.title), quote(item.seoTitle), quote(item.eyebrow), quote(item.intro), json(item.body), quote(item.image), json(item.highlights), item.contentPending ? "true" : "false", json(presentation), "'published'", String(index)];
});

const locationRows = locations.map((item, index) => [quote(item.slug), quote(item.slug), quote(item.name), quote(item.seoTitle), quote(item.intro), json(item.body), quote(item.image), json(item.coordinates), quote(item.mapDescription), "'published'", String(index)]);
const offerRows = offers.map((item, index) => [quote(item.slug), quote(item.slug), quote(item.title), quote(item.seoTitle), quote(item.eyebrow), quote(item.intro), json(item.body), quote(item.image), json(item.bullets), "'published'", String(index)]);
const blogRows = blogs.map((item, index) => [quote(item.slug), quote(item.slug), quote(item.title), quote(item.category), quote(item.date), quote(item.excerpt), quote(item.image), json(item.blocks ?? []), quote(item.status), String(index)]);
const faqRows = allFaqs.map((item, index) => [quote(item.id), quote(item.category), quote(item.question), quote(item.answer), retiredFaq.test(item.id) ? "false" : item.visible ? "true" : "false", retiredFaq.test(item.id) ? "'retired'" : "'published'", String(index)]);
const galleryRows = gallery.map((item, index) => [quote(item.id), quote(item.image), quote(item.caption), quote(item.category), "'published'", String(index)]);
const mediaRows = walk(join(root, "public/images")).map((file) => {
  const legacyPath = `/${relative(join(root, "public"), file).replaceAll("\\", "/")}`;
  const checksum = createHash("sha256").update(readFileSync(file)).digest("hex");
  return [quote(legacyPath), quote(`legacy/${basename(file)}`), quote(legacyPath), quote(mimeType(file)), quote(checksum), "false", "true"];
});

const statements = [
  "-- Generated from the approved local content sources. Do not hand-edit this file.\nbegin;\n",
  insert("cms_site_settings", ["key", "value", "is_public"], [[quote("site"), json(site), "true"]], "key"),
  insert("cms_services", ["legacy_key", "slug", "title", "seo_title", "eyebrow", "intro", "body", "image_path", "highlights", "content_pending", "content_json", "status", "sort_order"], serviceRows, "legacy_key"),
  insert("cms_locations", ["legacy_key", "slug", "name", "seo_title", "intro", "body", "image_path", "coordinates", "map_description", "status", "sort_order"], locationRows, "legacy_key"),
  insert("cms_offers", ["legacy_key", "slug", "title", "seo_title", "eyebrow", "intro", "body", "image_path", "bullets", "status", "sort_order"], offerRows, "legacy_key"),
  insert("cms_blog_posts", ["legacy_key", "slug", "title", "category", "display_date", "excerpt", "image_path", "blocks", "status", "sort_order"], blogRows, "legacy_key"),
  insert("cms_faqs", ["legacy_key", "category", "question", "answer", "is_visible", "status", "sort_order"], faqRows, "legacy_key"),
  insert("cms_gallery_items", ["legacy_key", "image_path", "caption", "category", "status", "sort_order"], galleryRows, "legacy_key"),
  insert("cms_media_assets", ["legacy_path", "storage_path", "fallback_path", "mime_type", "checksum_sha256", "storage_ready", "is_public"], mediaRows, "legacy_path"),
  `insert into public.cms_migration_batches (key, source_checksum, summary) values (${quote("phase-02-approved-static-content")}, ${quote(createHash("sha256").update(JSON.stringify({ services, locations, offers, blogs, faqs, gallery, site })).digest("hex"))}, ${quote("Approved static content seed; retired BYD/Lexus advisory questions are retained as retired records.")}) on conflict (key) do nothing;\ncommit;\n`,
].join("\n");

const output = join(root, "supabase/seed/legacy-content.sql");
mkdirSync(resolve(output, ".."), { recursive: true });
writeFileSync(output, statements, "utf8");
console.log(`Generated ${relative(root, output)} with ${services.length} services, ${blogs.length} blogs, ${allFaqs.length} FAQ records, ${gallery.length} gallery records, and ${mediaRows.length} media records.`);

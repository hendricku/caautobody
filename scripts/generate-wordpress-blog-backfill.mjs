/**
 * Safe, reviewable import of an approved offline JSON snapshot of BlogContent[]
 * (e.g. download the existing /api/blogs WordPress import JSON).
 * Does NOT fetch WordPress or modify the database automatically.
 * Does NOT replace articles that already have approved blocks.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/generate-wordpress-blog-backfill.mjs ./approved-blog-snapshot.json");
const entries = JSON.parse(readFileSync(resolve(input), "utf8"));
if (!Array.isArray(entries) || entries.length > 200) throw new Error("Expected a BlogContent[] snapshot of at most 200 articles");
const quote = (s) => `'${String(s).replaceAll("'", "''")}'`;
let emitted = 0;
const sql = ["-- REVIEW EVERY ARTICLE AND IMAGE BEFORE RUNNING THIS FILE. No inserts/deletions.\nbegin;"];
for (const entry of entries) {
  if (!entry || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug || "")) throw new Error("Invalid snapshot slug");
  if (!Array.isArray(entry.blocks) || !entry.blocks.length) continue;
  if (entry.blocks.length > 250 || entry.blocks.some((block) => !["heading","text","image","list","callout"].includes(block.type))) throw new Error(`Invalid block in ${entry.slug}`);
  sql.push(`update public.cms_blog_posts set blocks = ${quote(JSON.stringify(entry.blocks))}::jsonb where slug = ${quote(entry.slug)} and status='published' and jsonb_array_length(blocks)=0;`);
  emitted++;
}
sql.push("commit;");
const file = resolve("supabase/seed/wordpress-blog-backfill.sql");
mkdirSync(dirname(file),{recursive:true});writeFileSync(file,sql.join("\n")+"\n");
console.log(`Generated reviewed-backfill candidate with ${emitted} articles. No database changes made. Open and inspect ${file}.`);

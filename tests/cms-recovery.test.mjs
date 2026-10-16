import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
test("public blog receives CMS article and listing props", () => {
  assert.match(read("src/app/blog/[slug]/page.tsx"), /BlogPostClient article=\{article\} posts=\{posts\}/);
  assert.match(read("src/components/Public/BlogPostClient.tsx"), /\{ article, posts \}/);
  assert.doesNotMatch(read("src/components/Public/BlogPostClient.tsx"), /useImportedBlogs|dangerouslySetInnerHTML/);
  assert.doesNotMatch(read("src/components/Public/BlogIndexClient.tsx"), /useImportedBlogs|localStorage/);
});
test("server protects CMS writes and retires instead of hard deleting", () => {
  const api=read("src/app/api/admin/cms/[collection]/route.ts");
  assert.match(api, /sameOrigin\(request\)/);
  assert.match(api, /getAdmin\(\)/);
  assert.match(api, /status: "retired"/);
  assert.doesNotMatch(api, /\.delete\(\)/);
  const sql=read("supabase/migrations/20261013160000_cms_secure_administration.sql");
  assert.match(sql, /enable row level security/);
  assert.match(sql, /cms_staff_role/);
});
test("only publishers and admins can access customer enquiries directly", () => {
  const sql = read("supabase/migrations/20261016113000_restrict_enquiry_access_to_publishers.sql");
  assert.match(sql, /cms publishers read enquiries/);
  assert.match(sql, /cms_staff_role\(\) in \('admin', 'publisher'\)/);
  assert.doesNotMatch(sql, /'editor'/);
});
test("public FAQ has no browser-local overrides", () => {
  assert.doesNotMatch(read("src/components/Public/FAQList.tsx"), /useLocalCollection/);
});
test("assets and CMS seed are present", () => {
  assert.ok(existsSync(new URL("../public/images/logo.webp", import.meta.url)));
  assert.match(read("supabase/seed/legacy-content.sql"), /cms_media_assets/);
});

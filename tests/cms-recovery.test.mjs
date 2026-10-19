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
test("single-area maps use a compact full-width route layout", () => {
  const css = read("src/app/site-enhancements.css");
  assert.match(css, /\.service-area-map--single\{grid-template-columns:1fr;min-height:0\}/);
  assert.match(css, /\.service-area-map--single \.service-area-map__selection\{grid-template-columns:1fr;gap:7px\}/);
});
test("services directory keeps Tesla and Zeekr in Brands rather than duplicating them", () => {
  const page = read("src/app/services/page.tsx");
  const styles = read("src/app/service-refresh.css");
  assert.match(page, /brandOnlyServiceSlugs/);
  assert.match(page, /\.filter\(\(service\) => !brandOnlyServiceSlugs\.has\(service\.slug\)\)/);
  assert.doesNotMatch(page, /More approved repair options/);
  assert.match(page, /originalServiceCopy\[service\.slug\] \|\| \{ title: service\.title/);
  assert.match(styles, /\.ca-services-landing__card-action \.ui-action-icon/);
});
test("approved brand copy and contact enquiry contract stay source-controlled", () => {
  const editorialCopy = read("src/lib/originalServiceCopy.ts");
  const servicePage = read("src/components/Public/ServicePage.tsx");
  const brandCopy = read("src/lib/brandRepairContent.ts");
  const siteContent = read("src/lib/siteContent.ts");
  const contact = read("src/components/Public/ContactForm.tsx");
  const route = read("src/app/api/enquiries/route.ts");
  assert.match(siteContent, /BYD Approved Repairer Melbourne \| CA Autobody/);
  assert.match(siteContent, /Lexus Approved Body Shop Melbourne \| CA Autobody/);
  assert.match(brandCopy, /serviceGuide: \["BYD repair standards"/);
  assert.match(contact, /data\.set\("enquiryType", "contact"\)/);
  assert.match(route, /enquiryType: z\.enum\(\["contact", "brand-assessment"\]\)/);
  assert.match(route, /sendEnquiryEmail/);
  assert.ok(existsSync(new URL("../supabase/migrations/20261016140000_refresh_approved_brand_page_copy.sql", import.meta.url)));
  assert.match(editorialCopy, /approvedBrandServiceCopy/);
  assert.match(editorialCopy, /Zeekr Approved Repairer Melbourne/);
  assert.match(editorialCopy, /Zeekr X, 7X and 009/);
  assert.match(servicePage, /getApprovedBrandServiceCopy\(service\.slug\)/);
  assert.match(servicePage, /if \(exactCopy\) return <EditorialServicePage/);
});
test("public FAQ has no browser-local overrides", () => {
  assert.doesNotMatch(read("src/components/Public/FAQList.tsx"), /useLocalCollection/);
});
test("analytics reports stay admin-only, range-validated, and export-audited", () => {
  const reportRoute = read("src/app/api/admin/analytics/route.ts");
  const exportRoute = read("src/app/api/admin/analytics/export/route.ts");
  const reporting = read("src/lib/analytics/google-reporting.ts");
  const range = read("src/lib/analytics/range.ts");
  const gitignore = read(".gitignore");
  assert.match(reportRoute, /getAdmin\(\)/);
  assert.match(reportRoute, /admin\.role !== "admin"/);
  assert.match(reportRoute, /consumePublicRateLimit/);
  assert.match(reportRoute, /resolveAnalyticsRange/);
  assert.match(exportRoute, /sameOrigin\(request\)/);
  assert.match(exportRoute, /cms_record_analytics_export/);
  assert.match(exportRoute, /Content-Disposition/);
  assert.match(reporting, /analytics\.readonly/);
  assert.match(reporting, /webmasters\.readonly/);
  assert.match(reporting, /batchRunReports/);
  assert.match(range, /span >= 1 && span <= 366/);
  assert.match(gitignore, /caautobody-analytics-reader-\*\.json/);
});
test("assets and CMS seed are present", () => {
  assert.ok(existsSync(new URL("../public/images/logo.webp", import.meta.url)));
  assert.match(read("supabase/seed/legacy-content.sql"), /cms_media_assets/);
});

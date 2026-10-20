import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const collectionHook = read("src/lib/cms/useCmsCollection.ts");
const liveRefresh = read("src/components/CmsLiveRefresh.tsx");
const cmsRoute = read("src/app/api/admin/cms/[collection]/route.ts");
const layout = read("src/app/layout.tsx");
const dashboard = read("src/app/caautobodyadmin/(protected)/dashboard/page.tsx");
const modules = [
  read("src/app/caautobodyadmin/(protected)/blogs/page.tsx"),
  read("src/app/caautobodyadmin/(protected)/services/page.tsx"),
  read("src/app/caautobodyadmin/(protected)/faq/page.tsx"),
  read("src/app/caautobodyadmin/(protected)/gallery/page.tsx"),
  read("src/components/Admin/AdminStructuredCollection.tsx"),
];

test("CMS collection screens sync through their authenticated API only while visible", () => {
  assert.match(collectionHook, /CMS_SYNC_INTERVAL_MS = 15_000/);
  assert.match(collectionHook, /document\.visibilityState === "visible"/);
  assert.match(collectionHook, /fetch\(`\/api\/admin\/cms\/\$\{collection\}`/);
  assert.match(collectionHook, /latestRequest/);
});

test("published public pages use a content-version signal without receiving CMS rows", () => {
  assert.match(liveRefresh, /content-version/);
  assert.match(liveRefresh, /cms-publication/);
  assert.match(liveRefresh, /never CMS rows/);
  assert.match(layout, /<CmsLiveRefresh \/>/);
});

test("service updates revalidate the global layout for navigation and homepage placement", () => {
  assert.match(cmsRoute, /if \(collection === "services"\) revalidatePath\("\/", "layout"\)/);
});

test("every editable CMS collection reports live synchronisation and the dashboard distinguishes drafts", () => {
  modules.forEach((source) => assert.match(source, /lastSynced/));
  assert.match(dashboard, /awaiting publication/);
  assert.match(dashboard, /CMS publication signal/);
});

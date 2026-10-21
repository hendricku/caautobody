import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const navigation = read("src/components/Admin/AdminShell.tsx");
const directory = read("src/components/Admin/AdminServiceDirectory.tsx");
const editor = read("src/components/Admin/AdminServiceEditor.tsx");
const route = read("src/app/api/admin/cms/[collection]/route.ts");
const presentation = read("src/lib/cms/public-content.ts");

test("Brands has a distinct CMS workspace while retaining one service source of truth", () => {
  assert.match(navigation, /\["Brands", "\/caautobodyadmin\/brands"/);
  assert.match(directory, /useCmsCollection<CmsServiceContent>\("services"\)/);
  assert.match(directory, /isBrandPage/);
  assert.match(directory, /kind === "brand"/);
});

test("legacy branded records hydrate safely before an editor renders", () => {
  assert.match(route, /resolveServicePresentation\(withoutPlacement, str\(slug, 120\)\)/);
  assert.match(presentation, /export function resolveServicePresentation/);
  assert.match(presentation, /typeof data\.title === "string"/);
  assert.match(editor, /createEmptyBrandRepairContent/);
  assert.match(route, /scope: "cms-save", limit: 60, windowSeconds: 60, identity: admin\.user\.id, identityOnly: true/);
  assert.match(route, /scope: "cms-retire", limit: 20, windowSeconds: 60, identity: admin\.user\.id, identityOnly: true/);
});

test("brand routes cannot be used as an alternate editor for general services", () => {
  assert.match(editor, /kind === "brand" \? !isBrandPage\(item\) : isBrandPage\(item\)/);
  assert.match(read("src/app/caautobodyadmin/(protected)/brands/[slug]/preview/page.tsx"), /if \(!isBrandPage\(service\)\) notFound\(\)/);
});

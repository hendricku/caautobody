import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
test("draft update preserves existing content and creates six private landing records", async () => {
  const db = new PGlite();
  try {
    await db.exec("create table public.cms_offers(legacy_key text unique, slug text unique, title text, seo_title text, eyebrow text, intro text, image_path text, status text)");
    await db.exec("insert into cms_offers values('existing','existing','Keep title','SEO','Label','Keep content','image.webp','published')");
    await db.exec(readFileSync(new URL("../supabase/migrations/20261125120000_draft_existing_offers.sql", import.meta.url), "utf8"));
    const rows = (await db.query("select slug,status,intro from cms_offers")).rows;
    assert.equal(rows.length, 7);
    assert.ok(rows.every((row) => row.status === "draft"));
    assert.equal(rows.find((row) => row.slug === "existing").intro, "Keep content");
  } finally { await db.close(); }
});

test("homepage includes parseable business schema", async () => {
  const source = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  const mocks = {
    "@/components/Public/HomeV4": { __esModule: true, default: () => null },
    "@/lib/cms/public-content": { getPublishedHomeHero: async () => ({}), getPublishedHomeVideo: async () => "" },
  };
  new Function("require", "module", "exports", js)((id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id), loaded, loaded.exports);
  const markup = renderToStaticMarkup(await loaded.exports.default());
  const content = markup.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  assert.ok(content);
  const schema = JSON.parse(content);
  assert.equal(schema["@type"], "AutoBodyShop");
  assert.equal(schema.address.streetAddress, "7 Ashley Park Drive");
  assert.equal(schema.openingHoursSpecification[0].closes, "17:00");
});

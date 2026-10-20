import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function sourceModule(path) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", outputText)(() => { throw new Error("Unexpected import"); }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { copySlug, duplicateInput } = sourceModule("src/lib/cms/content-duplicate.ts");

test("service duplicates are independent drafts with a unique URL", () => {
  const source = {
    slug: "tesla-repair", title: "Tesla Repair", status: "published",
    body: ["Original copy"], highlights: ["Approved repairer"],
    presentation: { variant: "brand", data: { hero: { title: "Tesla Repair" } } },
    placement: { navigation: true, homeSlider: true, sliderLabel: "Tesla Repair" },
  };
  const copy = duplicateInput("services", source, copySlug(source.slug));
  assert.equal(copy.slug, "tesla-repair-copy");
  assert.equal(copy.title, "Tesla Repair (Copy)");
  assert.equal(copy.status, "draft");
  assert.deepEqual(copy.placement, source.placement);
  (copy.body).push("Draft-only copy");
  (copy.presentation).data.hero.title = "Draft title";
  copy.placement.sliderLabel = "Tesla Repair Copy";
  assert.deepEqual(source.body, ["Original copy"]);
  assert.equal(source.presentation.data.hero.title, "Tesla Repair");
  assert.equal(source.placement.sliderLabel, "Tesla Repair");
});

test("blog duplicates refresh block identities while keeping content and draft status", () => {
  const source = {
    slug: "repair-guide", title: "Repair Guide", status: "published",
    blocks: [{ id: "original", type: "text", content: "Independent content" }],
  };
  const copy = duplicateInput("blogs", source, copySlug(source.slug));
  assert.equal(copy.slug, "repair-guide-copy");
  assert.equal(copy.title, "Repair Guide (Copy)");
  assert.equal(copy.status, "draft");
  assert.equal(copy.blocks[0].content, "Independent content");
  assert.notEqual(copy.blocks[0].id, source.blocks[0].id);
  copy.blocks[0].content = "Edited draft";
  assert.equal(source.blocks[0].content, "Independent content");
});

test("copy slug stays valid and unique when repeated", () => {
  assert.equal(copySlug("tesla-repair"), "tesla-repair-copy");
  assert.equal(copySlug("tesla-repair", 1), "tesla-repair-copy-2");
  assert.match(copySlug("a".repeat(120), 99), /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(copySlug("a".repeat(120), 99).length <= 120);
});

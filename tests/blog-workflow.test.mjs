import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const editor = read("src/app/caautobodyadmin/(protected)/blogs/[slug]/page.tsx");
const preview = read("src/app/caautobodyadmin/(protected)/blogs/[slug]/preview/page.tsx");

test("blog editor exposes draft save, private preview and publisher-only publish actions", () => {
  assert.match(editor, /Save draft/);
  assert.match(editor, /Publish article/);
  assert.match(editor, /role !== "editor"/);
  assert.match(editor, /blogs\/\$\{post\.slug\}\/preview/);
  assert.match(editor, /Editors can only modify draft articles/);
});

test("blog preview is authenticated, private, and excludes retired records", () => {
  assert.match(preview, /getAdmin/);
  assert.match(preview, /if \(!admin\) notFound\(\)/);
  assert.match(preview, /index: false, follow: false/);
  assert.match(preview, /\.neq\("status", "retired"\)/);
  assert.doesNotMatch(preview, /dangerouslySetInnerHTML/);
});

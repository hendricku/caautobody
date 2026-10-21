import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const styles = read("src/app/blog-article.css");
const editor = read("src/app/caautobodyadmin/(protected)/blogs/[slug]/page.tsx");
const defaults = read("src/lib/blogContent.ts");

test("blog articles keep readable copy while giving landscape images more desktop room", () => {
  assert.match(styles, /\.article-body__content\{width:100%;max-width:760px;margin:0\}/);
  assert.match(styles, /\.article-body__layout\.has-rail\{display:grid;grid-template-columns:300px minmax\(0,760px\)/);
  assert.match(styles, /\.article-body__layout:not\(\.has-rail\) \.article-body__image\{width:min\(1120px,calc\(100vw - 96px\)\)/);
  assert.match(styles, /\.article-body__image img\{display:block;width:100%;aspect-ratio:16\/9;object-fit:cover\}/);
});

test("blog image choices describe their visual result and new defaults favour landscape content", () => {
  assert.match(editor, /Wide article image \(landscape\)/);
  assert.match(editor, /Side image \(portrait crop\)/);
  assert.match(editor, /Choose <strong>Wide article image<\/strong>/);
  assert.match(defaults, /id: "lead-image"[\s\S]*placement: "full"/);
});

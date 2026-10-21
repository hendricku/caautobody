import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const styles = read("src/app/blog-article.css");
const editor = read("src/app/caautobodyadmin/(protected)/blogs/[slug]/page.tsx");
const defaults = read("src/lib/blogContent.ts");

test("blog articles use the same full landscape frame as the rest of the site", () => {
  assert.match(styles, /\.article-body__content\{width:100%;max-width:none;margin:0\}/);
  assert.match(styles, /\.article-body\{width:var\(--hp-shell\)/);
  assert.match(styles, /\.article-hero__content\{position:relative;z-index:2;width:var\(--hp-shell\)/);
  assert.match(styles, /\.article-body__layout\.has-rail\{display:grid;grid-template-columns:300px minmax\(0,1fr\)/);
  assert.match(styles, /\.article-body__layout:not\(\.has-rail\) \.article-body__content\{margin-inline:0\}/);
  assert.match(styles, /\.article-body__layout:not\(\.has-rail\) \.article-body__image\{width:100%;margin-inline:0;transform:none\}/);
  assert.match(styles, /\.article-body__image img\{display:block;width:100%;aspect-ratio:16\/9;object-fit:cover\}/);
  assert.match(styles, /\.article-hero\{box-sizing:border-box;min-height:clamp\(500px,52vw,660px\);padding-top:92px/);
});

test("blog image choices describe their visual result and new defaults favour landscape content", () => {
  assert.match(editor, /Wide article image \(landscape\)/);
  assert.match(editor, /Side image \(portrait crop\)/);
  assert.match(editor, /Choose <strong>Wide article image<\/strong>/);
  assert.match(defaults, /id: "lead-image"[\s\S]*placement: "full"/);
});

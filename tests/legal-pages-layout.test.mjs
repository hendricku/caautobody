import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const legalPage = read("src/components/Public/LegalPage.tsx");
const styles = read("src/app/premium-refinements.css");

test("legal pages render every policy section as visible semantic document content", () => {
  assert.match(legalPage, /<section id=\{section\.id\}/);
  assert.match(legalPage, /<h2 id=\{`\$\{section\.id\}-heading`\}>\{section\.title\}<\/h2>/);
  assert.doesNotMatch(legalPage, /<details/);
  assert.doesNotMatch(legalPage, /<summary/);
  assert.doesNotMatch(legalPage, /Icon/);
});

test("legal pages collapse to one readable column before phone widths", () => {
  assert.match(styles, /@media\(max-width:1020px\)\{\.ca-legal__body\{grid-template-columns:1fr;gap:38px\}/);
  assert.match(styles, /\.ca-legal__section-content\{max-width:760px\}/);
  assert.doesNotMatch(styles, /\.ca-legal__section summary/);
});

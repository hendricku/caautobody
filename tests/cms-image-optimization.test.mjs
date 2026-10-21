import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import sharp from "sharp";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);

function sourceModule(path) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", outputText)((id) => {
    if (id === "server-only") return {};
    if (id === "sharp") return nodeRequire("sharp");
    throw new Error(`Unexpected import: ${id}`);
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { CMS_WEBP_MAX_DIMENSION, optimiseCmsImage } = sourceModule("src/lib/cms/image-optimization.ts");

test("CMS image optimizer validates, orients, resizes and writes high-quality WebP", async () => {
  const source = await sharp({ create: { width: 3200, height: 1800, channels: 3, background: "#b48730" } }).jpeg({ quality: 96 }).toBuffer();
  const optimised = await optimiseCmsImage(source);
  assert.ok(optimised);
  assert.ok(optimised.bytes.subarray(0, 4).equals(Buffer.from("RIFF")));
  assert.ok(optimised.width <= CMS_WEBP_MAX_DIMENSION);
  assert.ok(optimised.height <= CMS_WEBP_MAX_DIMENSION);
  const metadata = await sharp(optimised.bytes).metadata();
  assert.equal(metadata.format, "webp");
});

test("CMS image optimizer rejects non-image bytes", async () => {
  assert.equal(await optimiseCmsImage(Buffer.from("not an image")), null);
});

test("all CMS upload entry points accept JPG, PNG and WebP through the shared control", () => {
  const field = readFileSync(new URL("../src/components/Admin/CmsImageField.tsx", import.meta.url), "utf8");
  const galleryEditor = readFileSync(new URL("../src/components/Admin/AdminLibraryEditor.tsx", import.meta.url), "utf8");
  assert.match(field, /image\/jpeg,image\/png,image\/webp/);
  assert.match(field, /automatically optimized to high-quality WebP/);
  assert.match(galleryEditor, /CmsImageField/);
  assert.doesNotMatch(galleryEditor, /accept="image\/webp"/);
});

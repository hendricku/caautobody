import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/components/Public/ServiceAreaMap.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true, resolveJsonModule: true } }).outputText;
const loaded = { exports: {} };
const mockRequire = (id) => {
  if (id === "next/link") return { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { ...props, href }, children) };
  if (id === "@/components/UI/ActionIcon") return { __esModule: true, default: () => null };
  if (id.endsWith(".json")) return { __esModule: true, default: [] };
  return require(id);
};
new Function("require", "module", "exports", compiled)(mockRequire, loaded, loaded.exports);
const ServiceAreaMap = loaded.exports.default;
const locations = [{ name: "Chelsea", slug: "chelsea", coordinates: [-38, 145] }];

test("directory retains nearby selection and shows the requested route copy and actions", () => {
  const markup = renderToStaticMarkup(React.createElement(ServiceAreaMap, { locations }));
  const document = new JSDOM(markup).window.document;
  assert.equal(document.querySelector(".service-area-map__areas button").textContent, "Chelsea");
  assert.match(document.querySelector(".service-area-route").textContent, /Can't make it to our workshop\? We'll come to you!/);
  assert.match(document.querySelector(".service-area-route").textContent, /Your vehicle, our care\. Wherever you are in Melbourne, we've got you covered\./);
  assert.equal(document.querySelector(".service-area-map__tow").getAttribute("href"), "/contact");
  const directions = new URL(document.querySelector(".service-area-map__actions .service-area-map__directions").getAttribute("href"));
  assert.equal(directions.pathname, "/maps/dir/");
  assert.match(directions.searchParams.get("destination"), /Ashley Park Drive/);
  assert.ok(document.querySelector(".service-area-map__selection[aria-live='polite']"));
});

test("single-area maps keep their compact layout", () => {
  const markup = renderToStaticMarkup(React.createElement(ServiceAreaMap, { locations, variant: "single-area" }));
  const document = new JSDOM(markup).window.document;
  assert.equal(document.querySelector(".service-area-route"), null);
  assert.ok(document.querySelector(".service-area-map__directions"));
});

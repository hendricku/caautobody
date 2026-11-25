import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)((id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id), loaded, loaded.exports);
  return loaded.exports;
}

test("GA4 queues Google-compatible configuration and one page view per navigation", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", { url: "https://www.caautobody.com.au/", pretendToBeVisual: true });
  const oldWindow = globalThis.window, oldDocument = globalThis.document;
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let pathname = "/";
  const query = new URLSearchParams();
  const client = load("../src/lib/analytics/client.ts");
  const forwarding = load("../src/lib/analytics/call-forwarding.ts");
  const component = load("../src/components/Common/AnalyticsConsent.tsx", {
    "next/script": { __esModule: true, default: ({ src }) => React.createElement("script", { "data-src": src }) },
    "next/navigation": { usePathname: () => pathname, useSearchParams: () => query },
    "@/lib/analytics/client": client,
    "@/lib/analytics/call-forwarding": forwarding,
  }).default;
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(component, { measurementId: "G-B7BTM2RSBE" }))));
    const commands = () => window.dataLayer.map((item) => {
      assert.equal(Object.prototype.toString.call(item), "[object Arguments]");
      return Array.from(item);
    });
    assert.deepEqual(commands().map((command) => command[0]), ["js", "config", "config", "config", "event"]);
    assert.equal(commands()[1][1], "G-B7BTM2RSBE");
    assert.equal(commands()[1][2].send_page_view, false);
    assert.equal(commands()[2][1], "AW-18353056138");
    assert.equal(commands()[3][1], "AW-18353056138/F9PfCI6X6KodEIrTta9E");
    assert.equal(commands()[3][2].phone_conversion_number, "03 9772 7411");
    assert.equal(typeof commands()[3][2].phone_conversion_callback, "function");
    const callLink = document.createElement("a");
    callLink.href = "tel:+61397727411";
    callLink.textContent = "Call 03 9772 7411";
    document.body.append(callLink);
    commands()[3][2].phone_conversion_callback("(03) 9000 1234", "+61390001234");
    assert.equal(callLink.getAttribute("href"), "tel:+61390001234");
    assert.equal(callLink.textContent, "Call (03) 9000 1234");
    assert.equal(commands()[4][1], "page_view");
    assert.equal(commands()[4][2].page_path, "/");
    pathname = "/services";
    await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(component, { measurementId: "G-B7BTM2RSBE" }))));
    assert.equal(commands().filter((command) => command[1] === "page_view").length, 2);
    assert.equal(commands().at(-1)[2].page_path, "/services");
  } finally {
    await act(async () => root.unmount());
    dom.window.close(); globalThis.window = oldWindow; globalThis.document = oldDocument;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/lib/analytics/call-forwarding.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function("require", "module", "exports", compiled)(require, loaded, loaded.exports);
const { createCallForwardingController } = loaded.exports;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("forwards matching business links including icons and inserted links, leaving other numbers alone", async () => {
  const { window } = new JSDOM('<body><a id="call" href="tel:+61397727411" aria-label="Call 03 9772 7411"><svg></svg>Call 03 9772 7411</a><a id="other" href="tel:000">Emergency</a></body>');
  const { document } = window;
  const controller = createCallForwardingController(document);
  controller.start();
  assert.equal(document.querySelector("#call").getAttribute("href"), "tel:+61397727411");
  controller.setForwardingNumber("(03) 9000 1234", "+61390001234");
  const call = document.querySelector("#call");
  assert.equal(call.getAttribute("href"), "tel:+61390001234");
  assert.equal(call.textContent, "Call (03) 9000 1234");
  assert.equal(call.getAttribute("aria-label"), "Call (03) 9000 1234");
  assert.ok(call.querySelector("svg"));
  assert.equal(document.querySelector("#other").getAttribute("href"), "tel:000");
  const added = document.createElement("a");
  added.href = "tel:0397727411";
  added.textContent = "03 9772 7411";
  document.body.append(added);
  await tick();
  assert.equal(added.getAttribute("href"), "tel:+61390001234");
  assert.equal(added.textContent, "(03) 9000 1234");
  controller.stop();
  window.close();
});

test("invalid callbacks do not change the regular business number", () => {
  const { window } = new JSDOM('<body><a href="tel:+61397727411">03 9772 7411</a></body>');
  const controller = createCallForwardingController(window.document);
  controller.start();
  controller.setForwardingNumber("invalid", "javascript:bad");
  assert.equal(window.document.querySelector("a").getAttribute("href"), "tel:+61397727411");
  assert.equal(window.document.querySelector("a").textContent, "03 9772 7411");
  controller.stop();
  window.close();
});

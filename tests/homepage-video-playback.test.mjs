import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/components/Public/HomepageVideo.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function("require", "module", "exports", compiled)(require, loaded, loaded.exports);

for (const videoId of ["", "GREXDcQ2eLc"]) {
  test(`${videoId ? "YouTube" : "Local"} video stays silent until played and pauses outside the section`, async () => {
    const dom = new JSDOM("<!doctype html><div id='root'></div>", { url: "https://example.com", pretendToBeVisual: true });
    const oldWindow = globalThis.window, oldDocument = globalThis.document, oldObserver = globalThis.IntersectionObserver;
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    let observe, pauses = 0;
    globalThis.IntersectionObserver = class { constructor(callback) { observe = callback; } observe() {} disconnect() {} };
    dom.window.HTMLMediaElement.prototype.pause = () => { pauses++; };
    const root = createRoot(document.getElementById("root"));
    try {
      await act(async () => root.render(React.createElement(loaded.exports.default, { videoId })));
      assert.equal(document.querySelector(".homepage-video-controls"), null);
      if (!videoId) {
        const video = document.querySelector("video");
        assert.equal(video.autoplay, false);
        assert.equal(video.controls, true);
        await act(async () => observe([{ isIntersecting: false, intersectionRatio: 0 }]));
        assert.equal(pauses, 1);
      } else {
        const iframe = document.querySelector("iframe");
        assert.equal(new URL(iframe.src).searchParams.get("autoplay"), null);
        const commands = [];
        iframe.contentWindow.postMessage = (message, target) => commands.push([JSON.parse(message).func, target]);
        await act(async () => observe([{ isIntersecting: false, intersectionRatio: 0 }]));
        assert.deepEqual(commands.at(-1), ["pauseVideo", "https://www.youtube-nocookie.com"]);
      }
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      globalThis.window = oldWindow; globalThis.document = oldDocument; globalThis.IntersectionObserver = oldObserver;
      delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    }
  });
}

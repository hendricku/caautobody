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
const HomepageVideo = loaded.exports.default;

test("video continues offscreen and a visitor's pause is respected when scrolling", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", { url: "https://example.com", pretendToBeVisual: true });
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldObserver = globalThis.IntersectionObserver;
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.matchMedia = () => ({ matches: false });
  let observe;
  globalThis.IntersectionObserver = class { constructor(callback) { observe = callback; } observe() {} disconnect() {} };
  let plays = 0;
  let pauses = 0;
  Object.defineProperty(dom.window.HTMLMediaElement.prototype, "paused", { configurable: true, get() { return this.dataset.paused !== "false"; } });
  dom.window.HTMLMediaElement.prototype.play = function () { plays++; this.dataset.paused = "false"; this.dispatchEvent(new dom.window.Event("play")); return Promise.resolve(); };
  dom.window.HTMLMediaElement.prototype.pause = function () { pauses++; this.dataset.paused = "true"; this.dispatchEvent(new dom.window.Event("pause")); };
  const root = createRoot(dom.window.document.getElementById("root"));
  try {
    await act(async () => { root.render(React.createElement(HomepageVideo, { videoId: "" })); });
    assert.ok(document.querySelector(".homepage-video-controls__trigger"), "audio control is available before playback");
    await act(async () => { observe([{ isIntersecting: true, intersectionRatio: .8 }]); });
    assert.equal(plays, 1);
    assert.ok(document.querySelector(".homepage-video-controls__trigger"), "audio control remains visible at the video section");
    await act(async () => { observe([{ isIntersecting: false, intersectionRatio: 0 }]); });
    assert.equal(pauses, 0);
    assert.equal(document.querySelector("video").loop, true);
    assert.equal(document.querySelector("#homepage-audio-menu").hidden, true);
    await act(async () => { document.querySelector(".homepage-video-controls__trigger").click(); });
    assert.equal(document.querySelector("#homepage-audio-menu").hidden, false);
    assert.equal(document.querySelector(".homepage-video-controls__trigger").getAttribute("aria-expanded"), "true");
    await act(async () => { document.querySelector(".homepage-video-controls__trigger").click(); });
    assert.equal(document.querySelector("#homepage-audio-menu").hidden, true);
    await act(async () => { document.querySelector(".homepage-video-controls__trigger").click(); });
    await act(async () => { [...document.querySelectorAll(".homepage-video-controls__menu button")].find((button) => button.textContent === "Mute").click(); });
    assert.equal(document.querySelector("video").muted, true);
    assert.equal(pauses, 0);
    const pause = [...document.querySelectorAll(".homepage-video-controls button")].find((button) => button.textContent === "Pause");
    assert.ok(pause);
    await act(async () => { pause.click(); });
    assert.equal(pauses, 1);
    await act(async () => { observe([{ isIntersecting: true, intersectionRatio: .8 }]); observe([{ isIntersecting: false, intersectionRatio: 0 }]); });
    assert.equal(plays, 1);
    assert.equal(document.querySelector(".homepage-video-controls__menu button").textContent, "Play");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.IntersectionObserver = oldObserver;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

test("YouTube video loops and remains playing after leaving the section", async () => {
  const dom = new JSDOM("<!doctype html><div id='root'></div>", { url: "https://example.com", pretendToBeVisual: true });
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldObserver = globalThis.IntersectionObserver;
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.matchMedia = () => ({ matches: false });
  let observe;
  globalThis.IntersectionObserver = class { constructor(callback) { observe = callback; } observe() {} disconnect() {} };
  const root = createRoot(dom.window.document.getElementById("root"));
  try {
    await act(async () => { root.render(React.createElement(HomepageVideo, { videoId: "GREXDcQ2eLc" })); });
    const frame = document.querySelector("iframe");
    assert.ok(document.querySelector(".homepage-video-controls__trigger"), "YouTube audio control is available before playback");
    const url = new URL(frame.src);
    assert.equal(url.searchParams.get("loop"), "1");
    assert.equal(url.searchParams.get("playlist"), "GREXDcQ2eLc");
    const commands = [];
    frame.contentWindow.postMessage = (message) => commands.push(JSON.parse(message).func);
    await act(async () => { observe([{ isIntersecting: true, intersectionRatio: .8 }]); });
    await act(async () => { window.dispatchEvent(new dom.window.MessageEvent("message", { origin: "https://www.youtube-nocookie.com", source: frame.contentWindow, data: JSON.stringify({ event: "onReady" }) })); });
    assert.ok(commands.includes("playVideo"));
    await act(async () => { window.dispatchEvent(new dom.window.MessageEvent("message", { origin: "https://www.youtube-nocookie.com", source: frame.contentWindow, data: JSON.stringify({ event: "onStateChange", info: 1 }) })); });
    assert.ok(document.querySelector(".homepage-video-controls__trigger"), "YouTube audio control remains available at the video");
    await act(async () => { observe([{ isIntersecting: false, intersectionRatio: 0 }]); });
    assert.equal(commands.includes("pauseVideo"), false);
    await act(async () => { document.querySelector(".homepage-video-controls__trigger").click(); });
    await act(async () => { [...document.querySelectorAll(".homepage-video-controls__menu button")].find((button) => button.textContent === "Pause").click(); });
    assert.equal(commands.at(-1), "pauseVideo");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.IntersectionObserver = oldObserver;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

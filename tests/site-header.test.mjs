import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import ts from "typescript";

const require = createRequire(import.meta.url);
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.com/", pretendToBeVisual: true });
for (const key of ["window", "document", "Element", "HTMLElement", "Node"]) globalThis[key] = key === "window" ? dom.window : key === "document" ? dom.window.document : dom.window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
let pathname = "/";
let hoverCapable = true;
Object.defineProperty(window, "innerWidth", { value: 1440, writable: true });
window.matchMedia = () => ({ matches: window.innerWidth > 1020 && hoverCapable });

function Link({ href, children, ...props }) {
  return React.createElement("a", { ...props, href, onClick: (event) => event.preventDefault() }, children);
}
function Icon(props) { return React.createElement("svg", props); }
const source = readFileSync(new URL("../src/components/Layout/SiteHeader.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const headerModule = { exports: {} };
new Function("require", "module", "exports", compiled)((id) => {
  if (id === "next/link") return { default: Link };
  if (id === "next/navigation") return { usePathname: () => pathname };
  if (id === "@/lib/media") return { media: { logo: "/images/logo.webp" } };
  if (id.startsWith("@mui/icons-material/") || id === "@/components/UI/ActionIcon") return { default: Icon };
  return require(id);
}, headerModule, headerModule.exports);
const SiteHeader = headerModule.exports.default;
const settings = { name: "CA Autobody", phone: "03 9772 7411", phoneHref: "0397727411", email: "info@example.com", address: "Chelsea Heights" };
let root;

async function render(path = "/", width = 1440) {
  pathname = path;
  window.innerWidth = width;
  hoverCapable = true;
  document.body.innerHTML = '<div id="root"></div><button id="outside">Outside</button>';
  root = createRoot(document.getElementById("root"));
  await act(async () => root.render(React.createElement(SiteHeader, { siteSettings: settings })));
}
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  root = null;
  document.body.innerHTML = "";
});
const trigger = (name) => [...document.querySelectorAll(".hp-nav__trigger")].find((button) => button.textContent.trim() === name);
const group = (name) => trigger(name).closest(".hp-nav__group");
const panel = (name) => group(name).querySelector(".hp-mega");
const isOpen = (name) => trigger(name).getAttribute("aria-expanded") === "true";
const pointer = async (element, type, relatedTarget = document.body, pointerType = "mouse") => {
  await act(async () => element.dispatchEvent(new window.PointerEvent(type, { bubbles: true, relatedTarget, pointerType })));
};
const click = async (element) => { await act(async () => element.click()); };
const key = async (value) => { await act(async () => document.activeElement.dispatchEvent(new window.KeyboardEvent("keydown", { key: value, bubbles: true }))); };
const focus = async (element) => { await act(async () => element.focus()); };
const settleLeave = async () => { await act(async () => new Promise((resolve) => setTimeout(resolve, 160))); };

test("desktop hover opens a single menu and leaving the complete dropdown closes it", async () => {
  await render();
  const button = trigger("Brands");
  const link = panel("Brands").querySelector("a");
  await pointer(button, "pointerover");
  assert.equal(isOpen("Brands"), true);
  assert.equal(panel("Brands").getAttribute("aria-hidden"), "false");
  await pointer(button, "pointerout", link);
  await pointer(link, "pointerover", button);
  await settleLeave();
  assert.equal(isOpen("Brands"), true, "moving into a descendant panel must not close the menu");
  await pointer(link, "pointerout");
  await settleLeave();
  assert.equal(isOpen("Brands"), false);
  assert.equal(panel("Brands").getAttribute("aria-hidden"), "true");
});

test("switching groups and re-entering cancel stale mouse-leave timers", async () => {
  await render();
  await pointer(trigger("About Us"), "pointerover");
  await pointer(trigger("About Us"), "pointerout", trigger("Services"));
  await pointer(trigger("Services"), "pointerover", trigger("About Us"));
  await settleLeave();
  assert.equal(isOpen("About Us"), false);
  assert.equal(isOpen("Services"), true);
  assert.equal(document.querySelectorAll(".hp-nav__group.is-open").length, 1);
  await pointer(trigger("Services"), "pointerout");
  await pointer(trigger("Services"), "pointerover");
  await settleLeave();
  assert.equal(isOpen("Services"), true);
});

test("clicking a focused current-page link closes immediately without waiting for a route change", async () => {
  await render("/services/services-zeekr-approved-repairer-melbourne");
  await pointer(trigger("Brands"), "pointerover");
  const link = [...panel("Brands").querySelectorAll("a")].find((anchor) => anchor.getAttribute("href") === pathname);
  await focus(link);
  await click(link);
  assert.equal(isOpen("Brands"), false);
  assert.equal(document.activeElement === link, true, "retained link focus must not keep the dropdown open");
  assert.equal(document.querySelectorAll(".hp-nav__group.is-open").length, 0);
  // CSS must not override the controlled state through hover or retained focus.
  const css = readFileSync(new URL("../src/app/v4.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.hp-nav__group:(?:hover|focus-within)\s*>\s*\.hp-mega/);
});

test("same-page anchor links close the dropdown and pathname changes reset open state", async () => {
  await render("/about");
  await click(trigger("About Us"));
  await click(panel("About Us").querySelector('a[href="/about#why"]'));
  assert.equal(isOpen("About Us"), false);
  await click(trigger("Services"));
  pathname = "/contact";
  await act(async () => root.render(React.createElement(SiteHeader, { siteSettings: settings })));
  assert.equal(isOpen("Services"), false);
});

test("keyboard focus stays within an open dropdown; Escape closes it and returns focus", async () => {
  await render();
  await key("Tab");
  await focus(trigger("Services"));
  await click(trigger("Services"));
  const link = panel("Services").querySelector("a");
  await focus(link);
  assert.equal(isOpen("Services"), true);
  await pointer(link, "pointerout");
  await settleLeave();
  assert.equal(isOpen("Services"), true, "a keyboard-focused menu must survive unrelated mouse movement");
  await key("Escape");
  assert.equal(isOpen("Services"), false);
  assert.equal(document.activeElement === trigger("Services"), true);
  await click(trigger("Services"));
  await focus(link);
  await focus(document.getElementById("outside"));
  assert.equal(isOpen("Services"), false, "tabbing out must close the menu");
});

test("outside click closes a clicked-open desktop menu", async () => {
  await render();
  await click(trigger("Brands"));
  assert.equal(isOpen("Brands"), true);
  await click(document.getElementById("outside"));
  assert.equal(isOpen("Brands"), false);
});

test("mobile uses tap controls, closes both levels on selection, and clears scroll lock", async () => {
  await render("/", 390);
  const mobileToggle = document.querySelector(".hp-menu-toggle");
  await click(mobileToggle);
  assert.equal(document.body.classList.contains("hp-menu-open"), true);
  await pointer(trigger("Brands"), "pointerover", document.body, "touch");
  assert.equal(isOpen("Brands"), false, "touch must not synthesize hover-open state");
  await click(trigger("Brands"));
  assert.equal(isOpen("Brands"), true);
  await pointer(trigger("Brands"), "pointerout", document.body, "touch");
  await settleLeave();
  assert.equal(isOpen("Brands"), true, "touch taps must not be dismissed by pointerleave");
  await click(document.querySelector(".hp-mobile-brand-links a"));
  assert.equal(isOpen("Brands"), false);
  assert.equal(mobileToggle.getAttribute("aria-expanded"), "false");
  assert.equal(document.body.classList.contains("hp-menu-open"), false);
  await click(mobileToggle);
  assert.equal(isOpen("Brands"), false, "reopening navigation must not restore a stale submenu");
  await focus(trigger("About Us"));
  await click(trigger("About Us"));
  await key("Escape");
  assert.equal(mobileToggle.getAttribute("aria-expanded"), "false");
  assert.equal(document.activeElement === mobileToggle, true);
});

test("hover remains disabled for touch-only wide screens and resize resets disclosure state", async () => {
  await render();
  hoverCapable = false;
  await pointer(trigger("Brands"), "pointerover", document.body, "touch");
  assert.equal(isOpen("Brands"), false);
  await click(trigger("Brands"));
  assert.equal(isOpen("Brands"), true);
  window.innerWidth = 768;
  await act(async () => window.dispatchEvent(new window.Event("resize")));
  assert.equal(isOpen("Brands"), false);
});

test("a physical desktop pointer opens the menu even if an embedded browser reports no hover capability", async () => {
  await render();
  hoverCapable = false;
  await pointer(trigger("About Us"), "pointerover", document.body, "mouse");
  assert.equal(isOpen("About Us"), true);
  assert.equal(panel("About Us").getAttribute("aria-hidden"), "false");
});

test("the five-service desktop directory balances into three cells then two equal cells", () => {
  const css = readFileSync(new URL("../src/app/service-refresh.css", import.meta.url), "utf8");
  assert.match(css, /\.hp-header \.hp-mega--services \.hp-mega__service-grid \{ grid-template-columns: repeat\(6, minmax\(0, 1fr\)\); \}/);
  assert.match(css, /\.hp-header \.hp-mega--services \.hp-mega__service-grid > a:nth-child\(4\),\s*\.hp-header \.hp-mega--services \.hp-mega__service-grid > a:nth-child\(5\) \{ grid-column: span 3; border-bottom: 0; \}/);
});

test("the About menu uses a balanced two-by-two navigation directory beside its lead column", () => {
  assert.match(source, /className="hp-mega__about-directory"/);
  const css = readFileSync(new URL("../src/app/site-enhancements.css", import.meta.url), "utf8");
  assert.match(css, /\.hp-mega--about \.hp-mega__tray\{grid-template-columns:minmax\(330px,\.93fr\) minmax\(0,1\.42fr\);align-items:stretch\}/);
  assert.match(css, /\.hp-mega--about \.hp-mega__about-directory\{display:grid;grid-template-rows:auto 1fr;align-content:center;gap:15px/);
  assert.match(css, /\.hp-mega--about \.hp-mega__links\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\);grid-template-rows:repeat\(2,minmax\(0,1fr\)\);padding-left:0/);
  assert.match(css, /\.hp-mega--about \.hp-mega__links a:nth-child\(odd\)\{border-left:0\}/);
  assert.match(css, /\.hp-mega--about \.hp-mega__links a:nth-child\(n\+3\)\{border-bottom:0\}/);
  const finalCss = readFileSync(new URL("../src/app/service-refresh.css", import.meta.url), "utf8");
  assert.match(finalCss, /\.hp-header \.hp-nav__group\.is-open > \.hp-mega \{\s*display: block;\s*visibility: visible;\s*pointer-events: auto;\s*opacity: 1;/);
  assert.match(finalCss, /\.hp-header \.hp-mega--about \.hp-mega__links \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
});

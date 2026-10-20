import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const servicesEditor = read("src/app/caautobodyadmin/(protected)/services/page.tsx");
const publicContent = read("src/lib/cms/public-content.ts");
const cmsRoute = read("src/app/api/admin/cms/[collection]/route.ts");
const siteHeader = read("src/components/Layout/SiteHeader.tsx");
const carousel = read("src/components/Public/V4/ServiceExperience.tsx");

test("Services CMS exposes independent menu and homepage placement controls", () => {
  assert.match(servicesEditor, /Show in Services menu/);
  assert.match(servicesEditor, /Show in homepage slider/);
  assert.match(servicesEditor, /Published services can appear/);
  assert.match(servicesEditor, /placement: \{ \.\.\.value\.placement \}/);
});

test("service placement is allowlisted by the API and only published entries are public", () => {
  assert.match(cmsRoute, /navigationLabel: str\(rawPlacement\.navigationLabel, 100\)/);
  assert.match(cmsRoute, /sliderCopy: str\(rawPlacement\.sliderCopy, 600\)/);
  assert.match(cmsRoute, /content_json: \{ \.\.\.presentation, placement \}/);
  assert.match(publicContent, /\.eq\("status", "published"\)/);
  assert.match(publicContent, /getPublishedServiceNavigation/);
  assert.match(publicContent, /getPublishedServiceCarousel/);
});

test("public navigation and carousel are driven by CMS placement data", () => {
  assert.match(siteHeader, /serviceNavigation\.map/);
  assert.match(carousel, /function ServiceExperience\(\{ items = fallbackItems \}/);
  assert.match(carousel, /if \(!items\.length\) return null/);
  assert.match(publicContent, /prestige-brands/);
});

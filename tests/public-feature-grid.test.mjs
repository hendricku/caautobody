import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import ts from "typescript";
import postcss from "postcss";

const require = createRequire(import.meta.url);
const project = fileURLToPath(new URL("../", import.meta.url));
const cache = new Map();
const link = ({ children, href, ...props }) => React.createElement("a", { ...props, href }, children);
const image = (props) => React.createElement("img", Object.fromEntries(Object.entries(props).filter(([key]) => !["fill", "priority"].includes(key))));
const styles = Object.fromEntries(["frame", "grid", "cell", "marker", "title", "copy", "warm", "light", "dark"].map((name) => [name, `feature-${name}`]));

// Compile the actual server components, mocking only framework/browser boundaries.
function sourceModule(filename) {
  const absolute = path.resolve(project, filename);
  if (cache.has(absolute)) return cache.get(absolute);
  const loadedModule = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(absolute, "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const load = (id) => {
    if (id.endsWith(".module.css")) return { default: styles };
    if (id === "next/link") return { default: link };
    if (id === "next/image") return { default: image };
    if (id === "@/components/UI/Icon") return { default: () => React.createElement("svg", { "aria-hidden": true }) };
    if (id.endsWith("/PageHero")) return { default: ({ title }) => React.createElement("header", null, React.createElement("h1", null, title)) };
    if (id.endsWith("/BrandRepairMedia")) return { default: () => null };
    if (id.endsWith("/BrandAssessmentForm")) return { default: () => null };
    if (id === "./ServiceSectionNav") return { default: ({ items }) => React.createElement("nav", null, items.map((item) => React.createElement("a", { key: item.id, href: `#${item.id}` }, item.label))) };
    if (id.startsWith("@/") || id.startsWith("./")) {
      const base = id.startsWith("@/") ? path.resolve(project, "src", id.slice(2)) : path.resolve(path.dirname(absolute), id);
      const resolved = [base, `${base}.tsx`, `${base}.ts`].find((candidate) => existsSync(candidate));
      if (!resolved) throw new Error(`Cannot resolve ${id} from ${filename}`);
      return sourceModule(resolved);
    }
    return require(id);
  };
  new Function("require", "module", "exports", outputText)(load, loadedModule, loadedModule.exports);
  cache.set(absolute, loadedModule.exports);
  return loadedModule.exports;
}

const FeatureGrid = sourceModule("src/components/Public/FeatureGrid.tsx").default;
const AboutPage = sourceModule("src/app/about/page.tsx").default;
const EditorialServicePage = sourceModule("src/components/Public/EditorialServicePage.tsx").default;
const OfferPage = sourceModule("src/components/Public/OfferPage.tsx").default;
const BrandRepairPage = sourceModule("src/components/Public/BrandRepairPage.tsx").default;
const { services, offers } = sourceModule("src/lib/siteContent.ts");
const { getEditorialServiceCopy } = sourceModule("src/lib/originalServiceCopy.ts");
const { brandRepairContent } = sourceModule("src/lib/brandRepairContent.ts");
function render(Component, props) {
  return new JSDOM(renderToStaticMarkup(React.createElement(Component, props))).window.document;
}
const cellTitles = (root) => [...root.querySelectorAll(".feature-cell > .feature-title")].map((heading) => heading.textContent);

test("feature grid handles empty, single, odd and even item counts without placeholder cells", () => {
  assert.equal(renderToStaticMarkup(React.createElement(FeatureGrid, { items: [] })), "");
  for (const [count, columns] of [[1, 1], [2, 2], [3, 3], [4, 2], [5, 3], [6, 3], [7, 3], [8, 3]]) {
    const items = Array.from({ length: count }, (_, index) => ({ title: `Benefit ${index + 1}`, content: React.createElement("p", null, `Description ${index + 1}`) }));
    const document = render(FeatureGrid, { items });
    assert.equal(document.querySelector("ul").dataset.columns, String(columns));
    assert.equal(document.querySelector("ul").dataset.remainder, String(count % 3));
    assert.deepEqual(cellTitles(document), items.map((item) => item.title));
    assert.equal(document.querySelectorAll(".feature-cell").length, count);
    assert.equal(document.querySelectorAll(".feature-cell > h3 + .feature-copy > p").length, count);
  }
});

test("headings, ordered steps and screen-reader list semantics remain explicit", () => {
  const document = render(FeatureGrid, { ordered: true, headingLevel: 2, tone: "dark", items: [{ title: "Assessment", marker: "01" }] });
  assert.ok(document.querySelector(".feature-dark > ol[role=list] > li > h2"));
  assert.equal(document.querySelector(".feature-marker").getAttribute("aria-hidden"), "true");
  assert.equal(document.querySelector(".feature-copy"), null);
});

test("content is escaped, including unbroken long text, rather than injected as HTML", () => {
  const title = '<img src=x onerror="alert(1)">';
  const copy = "Long text ".repeat(120) + "https://example.com/" + "a".repeat(200);
  const document = render(FeatureGrid, { items: [{ title, content: React.createElement("p", null, copy) }] });
  assert.deepEqual(cellTitles(document), [title]);
  assert.equal(document.querySelector("p").textContent, copy);
  assert.equal(document.querySelector("img, script"), null);
});

test("About keeps all five benefits with pickup/drop-off copy below its heading", () => {
  const document = render(AboutPage);
  const benefits = document.querySelector("#why");
  assert.deepEqual(cellTitles(benefits), ["Replacement car available", "30+ years of experience", "VACC approved", "Lifetime warranty on repairs", "Local pickup and drop-off"]);
  const lastCell = benefits.querySelector(".feature-cell:last-child");
  assert.equal(lastCell.querySelector("h3 + div > p").textContent, "We offer pickup and drop-off support in local areas, so arranging a repair is easier to fit around your day.");
  assert.equal(benefits.querySelector(".about-reasons, .feature-marker"), null);
  assert.equal(document.querySelectorAll(".about-tips__points .feature-cell").length, 3);
  assert.ok(document.querySelector('a[href="/contact"]'));
});

test("repairer guidance follows its heading in one bounded reading flow", () => {
  const document = render(AboutPage);
  const tips = document.querySelector(".about-tips");
  const lead = tips.querySelector(".about-tips__lead");
  const points = tips.querySelector(".about-tips__points");
  const closing = tips.querySelector(".about-tips__closing");
  assert.ok(lead && points && closing);
  assert.equal(points.querySelectorAll(".feature-cell").length, 3);
  const flow = tips.textContent;
  assert.ok(flow.indexOf(lead.textContent) < flow.indexOf("A proven local reputation"));
  assert.ok(flow.indexOf("The right equipment") < flow.indexOf(closing.textContent));
});

test("editorial layout preserves safe gutters and a bounded Tesla approval mark", () => {
  const innerCss = readFileSync(path.resolve(project, "src/app/v4-inner.css"), "utf8");
  const servicesCss = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  const refinementsCss = readFileSync(path.resolve(project, "src/app/premium-refinements.css"), "utf8");
  assert.match(innerCss, /\.about-tips\{display:block\}/);
  assert.match(innerCss, /\.about-tips__body\{max-width:1080px/);
  assert.match(servicesCss, /\.ca-services-landing \.ca-services-landing__hero-inner\.shell\s*\{[^}]*width:\s*var\(--hp-shell\);[^}]*margin-inline:\s*auto/);
  assert.match(refinementsCss, /\.ca-service__brand-mark--image\{[^}]*max-width:620px;min-height:220px/);
  assert.match(refinementsCss, /\.ca-service__brand-mark--image img\{[^}]*height:180px[^}]*transform:scale\(1\.4\)/);
  const document = render(EditorialServicePage, { service: services.find((service) => service.slug === "tesla-approved-repair-centre"), copy: getEditorialServiceCopy("tesla-approved-repair-centre") });
  const mark = document.querySelector('img[alt="Tesla Approved Body Shop"]');
  assert.equal(mark.getAttribute("width"), "620");
  assert.equal(mark.getAttribute("height"), "220");
});

test("service chapters keep prose and boxed details under their heading, while FAQ actions stay bounded", () => {
  const css = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  assert.match(css, /\.ca-service \.ca-service__chapter-inner \{display: block\}/);
  assert.match(css, /\.ca-service \.ca-service__section-content \{max-width: 1080px; margin-top: clamp\(34px, 4vw, 56px\)}/);
  assert.match(css, /\.ca-service \.ca-service__bullet-list \{max-width: 960px;[^}]*border: 1px solid #d8d2c7}/);
  assert.match(css, /\.ca-service \.ca-service__faq-link-inner \{display: grid;grid-template-columns: minmax\(0, 620px\) max-content;justify-content: start/);

  const zeekrService = services.find((service) => service.slug === "services-zeekr-approved-repairer-melbourne");
  const zeekrCopy = getEditorialServiceCopy(zeekrService.slug);
  const zeekr = render(EditorialServicePage, { service: zeekrService, copy: zeekrCopy });
  const wideRange = [...zeekr.querySelectorAll(".ca-service__chapter")].find((chapter) => chapter.querySelector("h2")?.textContent === "Wide Range Of Services");
  assert.ok(wideRange);
  const wideRangeText = wideRange.textContent;
  assert.ok(wideRangeText.indexOf("CA Autobody offers complete accident repair") < wideRangeText.indexOf("Panel beating"));
  assert.ok(wideRangeText.indexOf("Final quality checks before handover") < wideRangeText.indexOf("Every repair is different"));
  assert.equal(wideRange.querySelectorAll(".ca-service__bullet-list li").length, 12);

  const panelService = services.find((service) => service.slug === "panel-beating");
  const panelCopy = getEditorialServiceCopy(panelService.slug);
  const panel = render(EditorialServicePage, { service: panelService, copy: panelCopy });
  const whyChoose = [...panel.querySelectorAll(".ca-service__chapter")].find((chapter) => chapter.querySelector("h2")?.textContent === "Why Choose Us");
  assert.ok(whyChoose);
  assert.equal(whyChoose.querySelectorAll(".feature-cell").length, 3);

  for (const service of services) {
    const copy = getEditorialServiceCopy(service.slug);
    if (!copy?.faqs.length) continue;
    const document = render(EditorialServicePage, { service, copy });
    const faq = document.querySelector(".ca-service__faq-link");
    assert.ok(faq, `${service.slug} should retain its FAQ band`);
    assert.equal(faq.querySelector("a").getAttribute("href"), `/frequently-asked-questions?category=${encodeURIComponent(copy.category)}`);
  }
});

for (const service of services) {
  const copy = getEditorialServiceCopy(service.slug);
  if (!copy) continue;
  test(`${service.slug}: capabilities, source headings, timelines and CTA links survive`, () => {
    const document = render(EditorialServicePage, { service, copy });
    const approved = service.slug === "tesla-approved-repair-centre" || copy.approvedBrandLayout;
    if (approved) {
      const capabilities = document.querySelector("#repair-standard");
      assert.equal(capabilities.querySelectorAll(".feature-cell").length, 6);
      assert.deepEqual(cellTitles(capabilities), copy.sections.slice(0, 6).map((section) => section.heading));
      assert.equal(capabilities.querySelectorAll("h2").length, 6);
      assert.ok(capabilities.querySelector(".feature-dark"));
    }
    const chapters = approved ? copy.sections.slice(6) : copy.sections;
    chapters.forEach((section, index) => {
      const chapter = document.querySelector(`#service-section-${index + 1}`);
      assert.equal(chapter.querySelectorAll(".feature-title, .ca-service__detail h3").length, section.blocks.filter((block) => block.type === "subheading").length);
      assert.equal(chapter.querySelectorAll(".ca-service__bullet-list li").length, section.blocks.filter((block) => block.type === "bullet").length);
      if (/process/i.test(section.heading)) assert.equal(chapter.querySelector(".feature-grid"), null);
    });
    assert.ok(document.querySelector('a[href="/contact"]'));
    assert.ok(document.querySelector('a[href="tel:+61397727411"]'));
    assert.equal(document.querySelector("form"), null, "approved brand pages must not regain embedded forms");
  });
}

test("mixed prose, capabilities and bullet lists stay in their supplied order", () => {
  const service = services[0];
  const copy = {
    slug: "example", category: "Example", title: "Example", introParagraphs: ["Intro"], brandMarks: [], faqs: [],
    sections: [{ heading: "Our services", blocks: [
      { type: "paragraph", text: "Before" },
      { type: "subheading", text: "First" }, { type: "paragraph", text: "First body" }, { type: "paragraph", text: "First extra" },
      { type: "subheading", text: "Second" }, { type: "paragraph", text: "Second body" },
      { type: "bullet", text: "List item" }, { type: "paragraph", text: "After" },
      { type: "subheading", text: "Third" }, { type: "paragraph", text: "Third body" },
    ] }],
  };
  // Use a non-Tesla slug so the fixture follows the normal chapter renderer.
  const document = render(EditorialServicePage, { service: { ...service, slug: "example" }, copy });
  const chapter = document.querySelector(".ca-service__section-content");
  const text = chapter.textContent;
  const phrases = ["Before", "First", "First body", "First extra", "Second", "Second body", "List item", "After", "Third", "Third body"];
  let offset = 0;
  for (const phrase of phrases) {
    const index = text.indexOf(phrase, offset);
    assert.ok(index >= offset, `Missing or reordered text: ${phrase}`);
    offset = index + phrase.length;
  }
  assert.equal(chapter.querySelectorAll(".feature-grid").length, 2);
});

test("every offer uses the same grid while retaining step order and contact links", () => {
  for (const offer of offers) {
    const document = render(OfferPage, { offer });
    assert.deepEqual(cellTitles(document), offer.bullets);
    assert.ok(document.querySelector(".feature-frame > ol[role=list]"));
    assert.ok(document.querySelector('a[href="/contact"]'));
  }
});

test("CMS brand fallback uses shared cells without changing its repair journey", () => {
  for (const content of Object.values(brandRepairContent)) {
    const document = render(BrandRepairPage, { content });
    assert.deepEqual(cellTitles(document), [...content.pillars, ...content.principles, ...content.capabilities].map((item) => item.title));
    assert.equal(document.querySelectorAll(".brand-journey ol > li").length, content.process.length);
  }
});

test("shared CSS parses and includes container-based tablet/mobile layouts without fixed heights or motion", () => {
  const css = readFileSync(path.resolve(project, "src/components/Public/FeatureGrid.module.css"), "utf8");
  const tree = postcss.parse(css);
  const containers = [];
  tree.walkAtRules("container", (rule) => containers.push(rule));
  assert.deepEqual(containers.map((rule) => rule.params), ["(max-width: 60rem)", "(max-width: 38rem)"]);
  assert.ok(containers[0].toString().includes("repeat(2, minmax(0, 1fr))"));
  assert.ok(containers[1].toString().includes("grid-template-columns: minmax(0, 1fr)"));
  tree.walkDecls((declaration) => {
    if (declaration.prop === "min-height") assert.equal(declaration.value, "0", "legacy minimum heights must be reset, never replaced by a fixed height");
    else assert.ok(!["height", "max-height", "animation", "transition"].includes(declaration.prop), `Unexpected size/motion constraint: ${declaration.prop}`);
  });
  assert.match(css, /overflow-wrap: anywhere/);
  for (const filename of ["src/app/v4-inner.css", "src/app/site-enhancements.css"]) {
    assert.doesNotMatch(readFileSync(path.resolve(project, filename), "utf8"), /\.about-reasons/);
  }
});

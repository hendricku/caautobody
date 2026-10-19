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
  const enhancements = readFileSync(path.resolve(project, "src/app/site-enhancements.css"), "utf8");
  assert.match(enhancements, /\.about-why__lead>div:last-child\{[^}]*font-size:clamp\(17px,1\.3vw,19px\);line-height:1\.78/);
});

test("repairer guidance sits below the heading while the criteria directory stays on the right", () => {
  const document = render(AboutPage);
  const tips = document.querySelector(".about-tips");
  const lead = tips.querySelector(".about-tips__lead");
  const points = tips.querySelector(".about-tips__points");
  const closing = tips.querySelector(".about-tips__closing");
  assert.ok(lead && points && closing);
  assert.equal(lead.parentElement, tips.querySelector(".about-tips__heading"));
  assert.equal(closing.parentElement, tips.querySelector(".about-tips__heading"));
  assert.equal(points.parentElement, tips.querySelector(".about-tips__body"));
  assert.equal(points.querySelectorAll(".feature-cell").length, 3);
  const flow = tips.textContent;
  assert.ok(flow.indexOf(lead.textContent) < flow.indexOf("A proven local reputation"));
  assert.ok(flow.indexOf(closing.textContent) < flow.indexOf("A proven local reputation"));
});

test("About separates the repairer guide from the Insurance section", () => {
  const document = render(AboutPage);
  const divider = document.querySelector(".about-insurance-divider");
  const insurance = document.querySelector("#insurance");
  const css = readFileSync(path.resolve(project, "src/app/v4-inner.css"), "utf8");
  assert.ok(divider);
  assert.equal(divider.nextElementSibling, insurance);
  assert.match(css, /\.about-insurance-divider\{height:1px;background:var\(--hp-line\)\}/);
});

test("editorial layout gives approved brands a useful, bounded introduction index", () => {
  const innerCss = readFileSync(path.resolve(project, "src/app/v4-inner.css"), "utf8");
  const servicesCss = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  const refinementsCss = readFileSync(path.resolve(project, "src/app/premium-refinements.css"), "utf8");
  assert.match(innerCss, /\.about-tips\{display:grid;grid-template-columns:minmax\(0,\.78fr\) minmax\(0,1\.22fr\)/);
  assert.match(innerCss, /\.about-tips__points \.frame \.grid\[data-columns\]\{grid-template-columns:1fr;border:0\}/);
  assert.match(servicesCss, /\.ca-services-landing \.ca-services-landing__hero-inner\.shell\s*\{[^}]*width:\s*var\(--hp-shell\);[^}]*margin-inline:\s*auto/);
  assert.match(refinementsCss, /\.ca-service__brand-mark--image\{[^}]*max-width:620px;min-height:220px/);
  assert.match(refinementsCss, /\.ca-service__brand-mark--image img\{[^}]*height:180px[^}]*transform:scale\(1\.4\)/);
  assert.match(refinementsCss, /\.ca-service--approved-brand \.ca-service__brand-intro-proof\{margin-top:auto\}/);
  assert.match(refinementsCss, /\.ca-service__brand-intro-proof\{width:min\(100%,840px\);margin-top:clamp\(42px,5\.5vw,84px\);padding:clamp\(28px,3vw,40px\) 0;border-top:1px solid #d6cfc2;border-bottom:1px solid #d6cfc2/);
  assert.match(refinementsCss, /\.ca-service__brand-intro-mark img\{display:block;width:min\(100%,500px\);height:clamp\(124px,11vw,164px\)/);
  assert.match(refinementsCss, /\.ca-service--tesla \.ca-service__brand-intro-mark\{min-height:clamp\(142px,11vw,174px\)/);
  assert.match(refinementsCss, /\.ca-service--tesla \.ca-service__brand-intro-mark img\{width:min\(100%,560px\);height:clamp\(142px,11vw,174px\)/);
  const document = render(EditorialServicePage, { service: services.find((service) => service.slug === "tesla-approved-repair-centre"), copy: getEditorialServiceCopy("tesla-approved-repair-centre") });
  const mark = document.querySelector('img[alt="Tesla Approved Body Shop"]');
  assert.equal(mark.getAttribute("width"), "620");
  assert.equal(mark.getAttribute("height"), "204");
  assert.equal(mark.getAttribute("src"), "/images/tesla-approved-body-shop.webp");
});

test("repairer criteria use ruled rows rather than a table frame", () => {
  const css = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  assert.match(css, /\.about-tips__points \{ border: 0; background: transparent; \}/);
  assert.match(css, /\.about-tips__points \.frame \.grid\[data-columns\] \{ border: 0; border-top: 1px solid var\(--hp-line\); background: transparent; \}/);
  assert.match(css, /\.about-tips__points \.frame \.grid\[data-columns\] > \.cell \{ border: 0; border-bottom: 1px solid var\(--hp-line\); background: transparent; \}/);
});

test("FAQ topic index uses a prominent directory scale", () => {
  const css = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  assert.match(css, /\.ca-faq-page \.faq-topic-picker \{grid-template-columns: minmax\(220px, 285px\) minmax\(0, 1fr\)/);
  assert.match(css, /\.ca-faq-page \.faq-topic-index button \{min-height: 60px; font-size: clamp\(16px, 1\.22vw, 18px\)/);
  assert.match(css, /\.ca-faq-page \.faq-topic-index button small \{font-size: 11px; font-weight: 700;[\s\S]*tabular-nums/);
});

test("every service guide uses a readable directory scale for its section topics", () => {
  const css = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  assert.match(css, /\.ca-service \.ca-service__introduction-grid \{grid-template-columns: minmax\(215px, \.33fr\) minmax\(0, 1fr\); gap: clamp\(32px, 4vw, 68px\)\}/);
  assert.match(css, /\.ca-service \.ca-service__introduction-aside > \.ca-service__small-label \{\s*font-size: 13px !important;/);
  assert.match(css, /\.ca-service \.ca-service__introduction-aside > p \{\s*font-size: clamp\(26px, 1\.9vw, 30px\) !important;/);
  assert.match(css, /\.ca-service \.ca-service__index-links a \{\s*grid-template-columns: 42px minmax\(0, 1fr\);\s*gap: 16px;\s*font-size: clamp\(23px, 1\.8vw, 26px\) !important;/);
  assert.match(css, /\.ca-service \.ca-service__index-links a > span:first-child \{\s*font-size: 15px !important;/);
  assert.match(css, /\.ca-service \.ca-service__index-links a > span:last-child \{\s*font-size: clamp\(18px, 1\.3vw, 20px\) !important;/);
});

test("mobile homepage keeps the phone action above the brand directory", () => {
  const home = readFileSync(path.resolve(project, "src/components/Public/HomeV4.tsx"), "utf8");
  const css = readFileSync(path.resolve(project, "src/app/v4.css"), "utf8");
  assert.match(home, /href="tel:\+61397727411" variant="hero-secondary" className="hp-btn--phone"/);
  assert.match(css, /@media\(max-width:720px\)\{[\s\S]*\.hp-hero\{min-height:0\}[\s\S]*\.hp-hero__actions \.hp-btn--phone\{display:inline-flex!important;min-height:52px;visibility:visible;opacity:1\}[\s\S]*\.hp-brands-wrap\{position:relative;bottom:auto;margin-top:32px/);
});

test("homepage hero keeps the supplied CA Autobody workshop image", () => {
  const css = readFileSync(path.resolve(project, "src/app/v4.css"), "utf8");
  assert.match(css, /\.hp-hero__media\{[\s\S]*background-image:url\("\/images\/Chelsea-Auto-Body-003\.webp"\)/);
});

test("homepage EV repair feature uses the supplied Tesla workshop image", () => {
  const media = readFileSync(path.resolve(project, "src/lib/media.ts"), "utf8");
  const home = readFileSync(path.resolve(project, "src/components/Public/HomeV4.tsx"), "utf8");
  assert.match(media, /home:\s*\{\s*evRepair: "\/images\/20261016_134834\.webp"/);
  assert.match(home, /<img src=\{media\.home\.evRepair\} alt="Tesla at the CA Autobody workshop" loading="lazy" \/>/);
});

test("homepage review proof states the current 350-plus five-star review count", () => {
  const home = readFileSync(path.resolve(project, "src/components/Public/HomeV4.tsx"), "utf8");
  const quickActions = readFileSync(path.resolve(project, "src/components/Public/V4/QuickActions.tsx"), "utf8");
  const enhancements = readFileSync(path.resolve(project, "src/app/site-enhancements.css"), "utf8");
  assert.match(home, /<p>350\+ 5-star Google reviews\.<\/p>/);
  assert.doesNotMatch(home, /Based on Google reviews from our happy customers\./);
  assert.match(quickActions, /<b>350\+ five-star reviews<\/b>[\s\S]*<strong>4\.9<\/strong>/);
  assert.match(quickActions, /more than 350 five-star reviews/);
  assert.match(enhancements, /\.hp-google-rating-float__stars\{color:#f2b705;font-size:16px;letter-spacing:1px/);
});

test("specialist vehicle marks use their supplied WEBPs with the shared monochrome-to-colour hover treatment", () => {
  const media = readFileSync(path.resolve(project, "src/lib/media.ts"), "utf8");
  const home = readFileSync(path.resolve(project, "src/components/Public/HomeV4.tsx"), "utf8");
  const css = readFileSync(path.resolve(project, "src/app/v4.css"), "utf8");
  assert.match(media, /\["Tesla", "\/images\/Tesla Red\.webp"\]/);
  assert.match(media, /\["Zeekr", "\/images\/Zeekr Orange\.webp"\]/);
  assert.match(home, /hp-brand-logo\$\{name === "Zeekr" \? " hp-brand-logo--zeekr" : ""\}/);
  assert.match(media, /\["BYD", "\/images\/BYD Red\.webp"\]/);
  assert.match(media, /\["Lexus", "\/images\/Lexus Silver\.webp"\]/);
  assert.doesNotMatch(media, /vehicleBrandHighlightLogos/);
  assert.doesNotMatch(home, /hp-brand-logo__highlight|hp-brand-logo__base/);
  assert.match(css, /\.hp-brand-logo img\{max-width:90px;max-height:44px;object-fit:contain;filter:grayscale\(1\) contrast\(1\.25\);transition:filter \.25s,transform \.25s\}/);
  assert.match(css, /\.hp-brand-logo:hover img\{filter:none;transform:translateY\(-2px\)\}/);
  assert.match(css, /\.hp-brand-logo--zeekr img\{max-width:92px;max-height:76px\}/);
});

test("admin dashboard uses SVG arrows instead of iPhone emoji glyphs", () => {
  const dashboard = readFileSync(path.resolve(project, "src/app/caautobodyadmin/(protected)/dashboard/page.tsx"), "utf8");
  const css = readFileSync(path.resolve(project, "src/app/globals.css"), "utf8");
  assert.match(dashboard, /import Icon from "@\/components\/UI\/Icon";/);
  assert.match(dashboard, /Open website <Icon name="arrow-outward" \/>/);
  assert.match(dashboard, /<i aria-hidden="true"><Icon name="arrow-outward" \/><\/i>/);
  assert.match(dashboard, /<b aria-hidden="true"><Icon name="arrow-forward" \/><\/b>/);
  assert.doesNotMatch(dashboard, /↗/);
  assert.match(css, /\.admin-primary svg\{width:15px;height:15px;flex:0 0 auto\}/);
  assert.match(css, /\.quick-actions i svg,\.quick-actions b svg\{display:block;width:16px;height:16px\}/);
});

test("service chapters use a consistent desktop title rail and contact FAQ actions", () => {
  const css = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  assert.match(css, /@media \(min-width: 921px\) \{[\s\S]*\.ca-service \.ca-service__chapter-inner \{[\s\S]*display: grid; grid-template-columns: minmax\(210px, \.43fr\) minmax\(0, 1fr\)/);
  assert.match(css, /\.ca-service \.ca-service__chapter--zeekr-offerings \.ca-service__chapter-inner \{/);
  assert.match(css, /\.ca-service \.ca-service__zeekr-offerings-directory \{[\s\S]*border: 1px solid #d8d2c7; background: #fbfaf7;/);
  assert.match(css, /\.ca-service \.ca-service__chapter-inner \{display: block\}/);
  assert.match(css, /\.ca-service \.ca-service__section-content \{max-width: 1080px; margin-top: clamp\(34px, 4vw, 56px\)}/);
  assert.match(css, /\.ca-service \.ca-service__bullet-list \{max-width: 960px;[^}]*border: 1px solid #d8d2c7}/);
  const editorialCss = readFileSync(path.resolve(project, "src/app/service-editorial.css"), "utf8");
  assert.match(editorialCss, /\.ca-service__contact-faq\{margin-top:clamp\(24px,2\.4vw,32px\)\}/);
  assert.match(editorialCss, /\.ca-service__contact-faq \.ca-service__button\{min-width:min\(100%,260px\)\}/);

  const zeekrService = services.find((service) => service.slug === "services-zeekr-approved-repairer-melbourne");
  const zeekrCopy = getEditorialServiceCopy(zeekrService.slug);
  const zeekr = render(EditorialServicePage, { service: zeekrService, copy: zeekrCopy });
  const wideRange = [...zeekr.querySelectorAll(".ca-service__chapter")].find((chapter) => chapter.querySelector("h2")?.textContent === "Wide Range Of Services");
  assert.ok(wideRange);
  assert.ok(wideRange.classList.contains("ca-service__chapter--zeekr-offerings"));
  const zeekrOfferingCopy = wideRange.querySelector(".ca-service__zeekr-offerings-copy");
  const zeekrDirectory = wideRange.querySelector(".ca-service__zeekr-offerings-directory");
  assert.equal(zeekrOfferingCopy.parentElement, wideRange.querySelector(".ca-service__chapter-side"));
  assert.equal(zeekrOfferingCopy.querySelectorAll("p").length, 2);
  assert.match(zeekrOfferingCopy.textContent, /CA Autobody offers complete accident repair for Zeekr owners, including:/);
  assert.match(zeekrOfferingCopy.textContent, /Every repair is different, so we assess the damage properly/);
  assert.equal(zeekrDirectory.getAttribute("aria-label"), "Zeekr repair services");
  assert.equal(zeekrDirectory.querySelectorAll("li").length, 12);

  const panelService = services.find((service) => service.slug === "panel-beating");
  const panelCopy = getEditorialServiceCopy(panelService.slug);
  const panel = render(EditorialServicePage, { service: panelService, copy: panelCopy });
  const whyChoose = [...panel.querySelectorAll(".ca-service__chapter")].find((chapter) => chapter.querySelector("h2")?.textContent === "Why Choose Us");
  assert.ok(whyChoose);
  assert.ok(whyChoose.classList.contains("ca-service__chapter--panel-beating-why"));
  assert.match(whyChoose.querySelector(".ca-service__chapter-side-copy").textContent, /At CA Autobody, we are committed to providing top-notch panel beating services/);
  assert.equal(whyChoose.querySelectorAll(".ca-service__section-content > .ca-service__paragraph").length, 0, "the Panel Beating lead belongs below the left heading, not above the proof points");
  assert.equal(whyChoose.querySelectorAll(".feature-cell").length, 3);
  const panelContact = [...panel.querySelectorAll(".ca-service__chapter")].find((chapter) => chapter.querySelector("h2")?.textContent === "Contact Us For Expert Panel Beating Services!");
  assert.ok(panelContact.classList.contains("ca-service__chapter--panel-beating-contact"));

  for (const slug of ["byd-approved-repairer-melbourne", "lexus-approved-body-shop-melbourne"]) {
    const brandService = services.find((service) => service.slug === slug);
    const brandCopy = getEditorialServiceCopy(brandService.slug);
    const brand = render(EditorialServicePage, { service: brandService, copy: brandCopy });
    const offerings = [...brand.querySelectorAll(".ca-service__chapter")].find((chapter) => chapter.querySelector("h2")?.textContent === "Wide Range Of Services");
    assert.ok(offerings.classList.contains("ca-service__chapter--approved-brand-offerings"));
    assert.equal(offerings.querySelectorAll(".ca-service__approved-brand-offerings-directory li").length, 4);
  }

  const serviceRefresh = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  assert.match(serviceRefresh, /\.ca-service \.ca-service__introduction-body > p:first-child \{font-size: clamp\(16px, 1\.28vw, 19px\)\}/);
  assert.match(serviceRefresh, /\.ca-service \.ca-service__approved-brand-offerings-directory \{[\s\S]*display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*border: 1px solid #d8d2c7; background: #fbfaf7;/);
  assert.match(serviceRefresh, /\.ca-service \.ca-service__approved-brand-offerings-directory li::before \{[\s\S]*left: 12px;/);
  assert.doesNotMatch(serviceRefresh, /ca-service--opening-lead/);

  for (const service of services) {
    const copy = getEditorialServiceCopy(service.slug);
    if (!copy?.faqs.length) continue;
    const document = render(EditorialServicePage, { service, copy });
    const contactCopy = document.querySelector(".ca-service__contact-copy");
    const faq = contactCopy.querySelector(".ca-service__contact-faq a");
    assert.equal(document.querySelector(".ca-service__faq-link"), null, `${service.slug} should not retain a standalone FAQ band`);
    assert.ok(faq, `${service.slug} should place its FAQ action in the contact column`);
    assert.equal(faq.getAttribute("href"), `/frequently-asked-questions?category=${encodeURIComponent(copy.category)}`);
    assert.ok(contactCopy.querySelector(".ca-service__contact-faq").compareDocumentPosition(contactCopy.querySelector(".ca-service__contact-detail")) & 4, `${service.slug} should place the FAQ action before the workshop details`);
  }

  const serviceWithoutFaqs = services.find((service) => {
    const copy = getEditorialServiceCopy(service.slug);
    return copy && copy.faqs.length === 0;
  });
  const noFaqDocument = render(EditorialServicePage, { service: serviceWithoutFaqs, copy: getEditorialServiceCopy(serviceWithoutFaqs.slug) });
  assert.equal(noFaqDocument.querySelector(".ca-service__contact-faq"), null, "services without FAQs should not render an empty FAQ action");
});

test("automatic analytics has no consent prompt, while tracking remains client-side only", () => {
  const consent = readFileSync(path.resolve(project, "src/components/Common/AnalyticsConsent.tsx"), "utf8");
  const analyticsClient = readFileSync(path.resolve(project, "src/lib/analytics/client.ts"), "utf8");
  const footer = readFileSync(path.resolve(project, "src/components/Layout/SiteFooter.tsx"), "utf8");
  assert.match(consent, /<Script src=\{`https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=\$\{measurementId\}`\}/);
  assert.doesNotMatch(consent, /Allow analytics|No thanks|analytics-consent|localStorage/);
  assert.match(analyticsClient, /typeof window === "undefined" \|\| typeof window\.gtag !== "function"/);
  assert.doesNotMatch(footer, /AnalyticsPreferenceButton/);
});

test("homepage services include Tesla and Zeekr while the main services directory keeps brands separate", () => {
  const header = readFileSync(path.resolve(project, "src/components/Layout/SiteHeader.tsx"), "utf8");
  const serviceExperience = readFileSync(path.resolve(project, "src/components/Public/V4/ServiceExperience.tsx"), "utf8");
  const servicesPage = readFileSync(path.resolve(project, "src/app/services/page.tsx"), "utf8");
  const serviceMenu = header.slice(header.indexOf('className="hp-mega__service-grid"'), header.indexOf('</div>', header.indexOf('className="hp-mega__service-grid"')));
  assert.doesNotMatch(serviceMenu, /Tesla Repair|Zeekr Repair/);
  assert.match(serviceExperience, /label: "Tesla Repair"[\s\S]*href: "\/services\/tesla-approved-repair-centre"/);
  assert.match(serviceExperience, /label: "Zeekr Repair"[\s\S]*href: "\/services\/services-zeekr-approved-repairer-melbourne"/);
  assert.match(servicesPage, /brandOnlyServiceSlugs/);
});

test("Prestige Brands copy, Tesla hero photo and service breadcrumbs use the approved shared treatment", () => {
  const media = readFileSync(path.resolve(project, "src/lib/media.ts"), "utf8");
  const carousel = readFileSync(path.resolve(project, "src/components/Public/V4/ServiceExperience.tsx"), "utf8");
  const css = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  assert.match(media, /tesla: "\/images\/IMG-20260726-WA0010\.webp"/);
  assert.match(carousel, /copy: "Explore the services we offer for all prestige brands in all makes and models"/);
  assert.match(css, /\.ca-service \.ca-service__crumbs,[\s\S]*\.brand-repair-page \.brand-hero__crumbs \{[\s\S]*font-size: clamp\(12px, \.82vw, 15px\);/);
  assert.match(css, /@media \(max-width: 650px\) \{[\s\S]*font-size: clamp\(12px, 3\.4vw, 13px\);/);

  const tesla = render(EditorialServicePage, { service: services.find((service) => service.slug === "tesla-approved-repair-centre"), copy: getEditorialServiceCopy("tesla-approved-repair-centre") });
  assert.equal(tesla.querySelector('.ca-service__crumbs[aria-label="Breadcrumb"]')?.textContent.replace(/\s+/g, "").trim(), "Services/Tesla");

  for (const content of Object.values(brandRepairContent)) {
    const brand = render(BrandRepairPage, { content });
    assert.equal(brand.querySelector('.brand-hero__crumbs[aria-label="Breadcrumb"]')?.textContent.replace(/\s+/g, "").trim(), `Services/${content.brand}`);
  }
});

test("map controls remain in their own stacking context below the page header", () => {
  const css = readFileSync(path.resolve(project, "src/app/site-enhancements.css"), "utf8");
  assert.match(css, /\.service-area-map__map-panel\{isolation:isolate;z-index:0\}/);
  assert.match(css, /\.service-area-map__legend,\.service-area-map__directions\{z-index:2\}/);
  assert.match(css, /\.service-area-map__fallback\{z-index:3\}/);
});

for (const service of services) {
  const copy = getEditorialServiceCopy(service.slug);
  if (!copy) continue;
  test(`${service.slug}: capabilities, source headings, timelines and CTA links survive`, () => {
    const document = render(EditorialServicePage, { service, copy });
    assert.equal(document.querySelectorAll(".ca-service__chapter-count").length, 0, "service chapters should not show decorative section counts");
    const approved = service.slug === "tesla-approved-repair-centre" || copy.approvedBrandLayout;
    if (approved) {
      const capabilities = document.querySelector("#repair-standard");
      assert.equal(capabilities.querySelectorAll(".feature-cell").length, 6);
      assert.deepEqual(cellTitles(capabilities), copy.sections.slice(0, 6).map((section) => section.heading));
      assert.equal(capabilities.querySelectorAll("h2").length, 6);
      assert.ok(capabilities.querySelector(".feature-dark"));
      const introProof = document.querySelector(".ca-service__brand-intro-proof");
      if (copy.category === "Tesla") {
        assert.ok(introProof, `${service.slug} should retain its supplied approval mark`);
        assert.equal(introProof.querySelector("img").getAttribute("alt"), "Tesla Approved Body Shop");
      } else {
        assert.equal(introProof, null, `${service.slug} should use its expanded opening copy instead of an intro logo`);
      }
    }
    const chapters = approved ? copy.sections.slice(6) : copy.sections;
    chapters.forEach((section, index) => {
      const chapter = document.querySelector(`#service-section-${index + 1}`);
      assert.equal(chapter.querySelectorAll(".feature-title, .ca-service__detail h3").length, section.blocks.filter((block) => block.type === "subheading").length);
      const isCompactBrandDirectory = ["byd-approved-repairer-melbourne", "lexus-approved-body-shop-melbourne"].includes(service.slug) && /^Wide Range Of Services$/i.test(section.heading);
      const bulletSelector = service.slug === "services-zeekr-approved-repairer-melbourne" && /^Wide Range Of Services$/i.test(section.heading)
        ? ".ca-service__zeekr-offerings-directory li"
        : isCompactBrandDirectory
          ? ".ca-service__approved-brand-offerings-directory li"
          : ".ca-service__bullet-list li";
      assert.equal(chapter.querySelectorAll(bulletSelector).length, section.blocks.filter((block) => block.type === "bullet").length);
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

test("Zeekr, BYD and Lexus introductions use the supplied full copy without intro logos", () => {
  const expected = {
    "services-zeekr-approved-repairer-melbourne": "When your Zeekr has been damaged in an accident, choosing the right repairer matters.",
    "byd-approved-repairer-melbourne": "BYD vehicles combine high voltage architecture, battery systems, advanced driver assistance technology and model specific body structures.",
    "lexus-approved-body-shop-melbourne": "A Lexus repair must restore safety, body accuracy, finish quality and the quiet refinement expected from the vehicle.",
  };
  for (const [slug, opening] of Object.entries(expected)) {
    const service = services.find((item) => item.slug === slug);
    const copy = getEditorialServiceCopy(slug);
    const document = render(EditorialServicePage, { service, copy });
    assert.equal(copy.introParagraphs.length, 3);
    assert.ok(copy.introParagraphs[0].startsWith(opening));
    assert.equal(document.querySelector(".ca-service__brand-intro-proof"), null);
    assert.equal(document.querySelectorAll(".ca-service__introduction-body > p").length, 3);
  }
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

test("service and brand heroes keep copy separate from their supplied right-hand imagery", () => {
  const media = readFileSync(path.resolve(project, "src/lib/media.ts"), "utf8");
  const servicePage = readFileSync(path.resolve(project, "src/components/Public/EditorialServicePage.tsx"), "utf8");
  const brandPage = readFileSync(path.resolve(project, "src/components/Public/BrandRepairPage.tsx"), "utf8");
  const css = readFileSync(path.resolve(project, "src/app/service-refresh.css"), "utf8");
  assert.match(media, /heroPanels:\s*\{[\s\S]*accident: "\/images\/accident\.webp"[\s\S]*tesla: "\/images\/IMG-20260726-WA0010\.webp"[\s\S]*lexus: "\/images\/lexusmodel\.webp"[\s\S]*zeekr: "\/images\/Zeekr Covered Plates\.webp"/);
  assert.match(servicePage, /const heroPanelByService: Record<string, string>/);
  assert.match(servicePage, /className="ca-service__hero-background"/);
  assert.match(servicePage, /<img src=\{heroPanelFor\(service\)\} alt="" fetchPriority="high" \/>/);
  assert.match(servicePage, /"services-zeekr-approved-repairer-melbourne": media\.heroPanels\.zeekr/);
  assert.match(servicePage, /"byd-approved-repairer-melbourne": media\.heroPanels\.byd/);
  assert.match(servicePage, /"lexus-approved-body-shop-melbourne": media\.heroPanels\.lexus/);
  assert.match(brandPage, /content\.brand === "BYD"[\s\S]*media\.heroPanels\.byd[\s\S]*content\.brand === "Lexus"[\s\S]*media\.heroPanels\.lexus/);
  assert.match(brandPage, /className="brand-hero__background"/);
  assert.match(brandPage, /className="brand-hero__media"/);
  assert.match(brandPage, /className="brand-assessment-intake"/);
  assert.match(css, /\.ca-service \.ca-service__hero-grid \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1\.04fr\) minmax\(360px, \.86fr\);/);
  assert.match(css, /\.brand-repair-page \.brand-hero__layout \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1\.04fr\) minmax\(360px, \.86fr\);/);
  assert.match(css, /\.ca-service \.ca-service__hero-media \{[\s\S]*border: 1px solid rgba\(226, 211, 180, \.46\);[\s\S]*box-shadow: inset 0 1px 0 rgba\(255,255,255,\.20\), 0 22px 46px rgba\(0,0,0,\.34\);/);
  assert.match(css, /\.brand-repair-page \.brand-hero__media \{[\s\S]*border: 1px solid rgba\(226, 211, 180, \.46\);[\s\S]*box-shadow: inset 0 1px 0 rgba\(255,255,255,\.20\), 0 22px 46px rgba\(0,0,0,\.34\);/);
  assert.match(css, /\.ca-service \.ca-service__hero-background,[\s\S]*\.brand-repair-page \.brand-hero__background \{/);
  assert.match(css, /@media \(max-width: 700px\) \{[\s\S]*\.ca-service \.ca-service__hero-grid,[\s\S]*padding-top: clamp\(50px, 12vw, 68px\);[\s\S]*\.ca-service \.ca-service__hero-media,[\s\S]*order: 0;[\s\S]*width: calc\(100% \+ \(var\(--pad\) \* 2\)\);[\s\S]*border: 0;[\s\S]*box-shadow: none;/);
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

import Link from "next/link";
import Image from "next/image";
import type { ServiceContent } from "@/types/content";
import type { OriginalServicePage, ServiceBlock, OriginalServiceSection } from "@/lib/originalServiceCopy";
import { getEditorialServiceCopy } from "@/lib/originalServiceCopy";
import { services } from "@/lib/siteContent";
import { media } from "@/lib/media";
import ServiceSectionNav, { type SectionNavigationItem } from "./ServiceSectionNav";
import Icon from "@/components/UI/Icon";
import FeatureGrid from "./FeatureGrid";

type ContentGroup =
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "detail"; heading: string; paragraphs: string[] };

// Preserve the supplied wording while rendering punctuation from the original
// Windows-authored service document correctly in the browser.
function sourceText(value: string): string {
  return value
    .replaceAll("â€™", "’")
    .replaceAll("â€œ", "“")
    .replaceAll("â€�", "”")
    .replaceAll("â€“", "–")
    .replaceAll("â€”", "—")
    .replaceAll("Â", "");
}

function heroLead(value: string): string {
  const sentences = value.match(/.+?[.!?](?:\s+.+?[.!?])?/);
  return sentences?.[0] ?? value;
}

function contentGroups(blocks: ServiceBlock[]): ContentGroup[] {
  const groups: ContentGroup[] = [];
  for (const block of blocks) {
    if (block.type === "subheading") {
      groups.push({ kind: "detail", heading: sourceText(block.text), paragraphs: [] });
    } else if (block.type === "bullet") {
      const last = groups[groups.length - 1];
      if (last?.kind === "bullets") last.items.push(sourceText(block.text));
      else groups.push({ kind: "bullets", items: [sourceText(block.text)] });
    } else {
      const last = groups[groups.length - 1];
      if (last?.kind === "detail") last.paragraphs.push(sourceText(block.text));
      else groups.push({ kind: "paragraph", text: sourceText(block.text) });
    }
  }
  return groups;
}

function sectionVariant(section: OriginalServiceSection): string {
  if (/process/i.test(section.heading)) return "process";
  if (/our services|wide range of services/i.test(section.heading)) return "offerings";
  if (/why choose/i.test(section.heading)) return "reasons";
  if (/models we can assist|smash repairs melbourne/i.test(section.heading)) return "collection";
  if (section.blocks.some((block) => block.type === "subheading")) return "details";
  return "story";
}

function sourceSectionId(index: number) { return `service-section-${index + 1}`; }

function SectionContent({ section, variant, dark }: { section: OriginalServiceSection; variant: string; dark: boolean }) {
  const groups = contentGroups(section.blocks);
  // Keep prose and bullet lists in source order. Only adjacent, unordered
  // heading/description pairs become cells; process steps retain their timeline.
  const compactGroups: (ContentGroup | { kind: "features"; items: Extract<ContentGroup, { kind: "detail" }>[] })[] = [];
  for (const group of groups) {
    if (group.kind === "detail" && variant !== "process") {
      const previous = compactGroups[compactGroups.length - 1];
      if (previous?.kind === "features") previous.items.push(group);
      else compactGroups.push({ kind: "features", items: [group] });
    } else compactGroups.push(group);
  }
  let detailIndex = 0;
  return (
    <div className={`ca-service__section-content${variant === "process" ? " ca-service__section-content--process" : ""}`}>
      {compactGroups.map((group, index) => {
        if (group.kind === "features") return (
          <FeatureGrid key={`features-${index}`} tone={dark ? "dark" : "light"} items={group.items.map((item) => ({
            title: item.heading,
            content: item.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>),
          }))} />
        );
        if (group.kind === "paragraph") return <p key={`paragraph-${index}`} className="ca-service__paragraph">{group.text}</p>;
        if (group.kind === "bullets") return <ul key={`bullets-${index}`} className="ca-service__bullet-list">{group.items.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{item}</li>)}</ul>;
        detailIndex += 1;
        return (
          <div className="ca-service__detail" key={`detail-${index}`}>
            <span className="ca-service__detail-no" aria-hidden="true">{String(detailIndex).padStart(2,"0")}</span>
            <div>
              <h3>{group.heading}</h3>
              {group.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EditorialSection({ section, index, total, isZeekr }: { section: OriginalServiceSection; index: number; total: number; isZeekr: boolean }) {
  const variant = sectionVariant(section);
  const reverse = isZeekr && index % 3 === 2;
  return (
    <section
      id={sourceSectionId(index)}
      className={`ca-service__chapter ca-service__chapter--${variant}${reverse ? " ca-service__chapter--ink" : ""}`}
      aria-labelledby={`service-section-heading-${index}`}
    >
      <div className="shell ca-service__chapter-inner">
        <div className="ca-service__chapter-side">
          <span className="ca-service__chapter-count">{String(index + 1).padStart(2, "0")} <span>/</span> {String(total).padStart(2, "0")}</span>
          <h2 id={`service-section-heading-${index}`}>{sourceText(section.heading)}</h2>
          <span className="ca-service__chapter-rule" aria-hidden="true" />
        </div>
        <SectionContent section={section} variant={variant} dark={reverse} />
      </div>
    </section>
  );
}

export default function EditorialServicePage({ service, copy }: { service: ServiceContent; copy: OriginalServicePage }) {
  const isTesla = service.slug === "tesla-approved-repair-centre";
  const isZeekr = service.slug === "services-zeekr-approved-repairer-melbourne";
  const usesApprovedBrandLayout = isTesla || copy.approvedBrandLayout === true;
  const featureSections = usesApprovedBrandLayout ? copy.sections.slice(0, 6) : [];
  const chapters = usesApprovedBrandLayout ? copy.sections.slice(6) : copy.sections;
  const related = services.filter((other) => other.slug !== service.slug && getEditorialServiceCopy(other.slug)).slice(0, 3);
  const faqHref = `/frequently-asked-questions?category=${encodeURIComponent(copy.category)}`;
  const navigation: SectionNavigationItem[] = [
    ...(usesApprovedBrandLayout ? [{ id: "repair-standard", label: `${sourceText(copy.category)} repair standards`, number: "01" }] : []),
    ...chapters.map((section, index) => ({ id: sourceSectionId(index), label: sourceText(section.heading), number: String(index + 1 + (usesApprovedBrandLayout ? 1 : 0)).padStart(2, "0") })),
    ...(copy.faqs.length ? [{ id: "service-faqs", label: "Questions & answers", number: "FAQ" }] : []),
  ];

  return (
    <main className={`ca-service${isTesla ? " ca-service--tesla" : ""}${isZeekr ? " ca-service--zeekr" : ""}`}>
      <section className="ca-service__hero" aria-labelledby="service-heading">
        <div className="ca-service__hero-media" aria-hidden="true">
          <img src={service.image} alt="" fetchPriority="high" />
        </div>
        <div className="shell ca-service__hero-grid">
          <div className="ca-service__hero-info">
            <div className="ca-service__crumbs"><Link href="/services">Services</Link><span aria-hidden="true">/</span><span>{sourceText(copy.category)}</span></div>
            <div className="ca-service__hero-title-group">
              <h1 id="service-heading">{sourceText(copy.title)}</h1>
              <p className="ca-service__hero-deck">{sourceText(heroLead(copy.heroDescription ?? copy.introParagraphs[0] ?? ""))}</p>
            </div>
            <div className="ca-service__hero-actions">
              <Link href="/contact" className="ca-service__button ca-service__button--gold">Enquire about a repair <Icon name="arrow-outward" /></Link>
              <a className="ca-service__hero-phone" href="tel:+61397727411">Call 03 9772 7411 <Icon name="arrow-outward" /></a>
            </div>
          </div>
        </div>
      </section>

      <section id="service-overview" className="ca-service__introduction" aria-label={`${sourceText(copy.title)} overview`}>
        <div className="shell ca-service__introduction-grid">
          <div className="ca-service__introduction-aside">
            <span className="ca-service__small-label">SERVICE GUIDE</span>
            <p>Explore the details.</p>
            <ServiceSectionNav items={navigation} />
          </div>
          <div className="ca-service__introduction-body">
            {copy.introParagraphs.map((paragraph, index) => <p key={index}>{sourceText(paragraph)}</p>)}
            {isTesla && copy.brandMarks.length > 0 ? <div className="ca-service__brand-mark ca-service__brand-mark--image"><Image src="/images/Tesla Approved.webp" alt="Tesla Approved Body Shop" width={620} height={220} sizes="(max-width: 720px) 100vw, 620px" /></div> : copy.brandMarks.length > 0 ? <div className="ca-service__brand-mark" aria-label={copy.brandMarks.map(sourceText).join(" ")}>{copy.brandMarks.map((mark, index) => <span key={mark} className={index === 0 ? "ca-service__brand-name" : "ca-service__brand-caption"}>{sourceText(mark)}</span>)}</div> : null}
          </div>
        </div>
      </section>

      {featureSections.length > 0 && <section id="repair-standard" className="ca-service__features" aria-label={`${sourceText(copy.category)} repair standards`}>
        <div className="shell">
          <div className="ca-service__features-top"><span className="ca-service__small-label">OUR CAPABILITIES</span><span>01 — 06</span></div>
          <FeatureGrid tone="dark" headingLevel={2} items={featureSections.map((section, index) => ({
            title: sourceText(section.heading),
            marker: String(index + 1).padStart(2, "0"),
            content: section.blocks.filter((block) => block.type === "paragraph").map((block, blockIndex) => <p key={blockIndex}>{sourceText(block.text)}</p>),
          }))} />
        </div>
      </section>}

      <div className="ca-service__chapters">
        {chapters.map((section, index) => <EditorialSection key={`${index}-${section.heading}`} section={section} index={index} total={chapters.length} isZeekr={isZeekr} />)}
      </div>

      {copy.faqs.length > 0 && <section id="service-faqs" className="ca-service__faq-link">
        <div className="shell ca-service__faq-link-inner">
          <div><span className="ca-service__small-label">NEED MORE INFORMATION?</span><h2>Questions before your repair?</h2><p>Read the original {copy.category} questions and answers on our dedicated FAQ page.</p></div>
          <Link className="ca-service__button ca-service__button--outline" href={faqHref}>View {copy.category} FAQs <Icon name="arrow-outward" /></Link>
        </div>
      </section>}

      <section className="ca-service__contact-band" aria-label="Contact the CA Autobody team">
        <div className="shell ca-service__contact-band-inner">
          <div className="ca-service__contact-copy">
            <span className="ca-service__small-label">YOUR NEXT STEP / CA AUTOBODY</span>
            <h2>{sourceText(copy.contactHeading ?? "Let’s talk about your vehicle.")}</h2>
            <span className="ca-service__chapter-rule" aria-hidden="true" />
            <p>{sourceText(copy.contactCopy ?? "Talk directly with our team about an assessment, repair options and getting back on the road.")}</p>
            {copy.disclaimer ? <p className="ca-service__disclaimer"><strong>Small print:</strong> {sourceText(copy.disclaimer)}</p> : null}
            <div className="ca-service__contact-detail"><span>VISIT THE WORKSHOP</span><strong>7 Ashley Park Drive<br />Chelsea Heights, VIC 3196</strong></div>
          </div>
          <div className="ca-service__contact-photo">
            <img src={media.workshop.floor} alt="CA Chelsea Autobody workshop" loading="lazy" />
            <div className="ca-service__contact-card">
              <p>READY TO GET STARTED?</p>
              <h3>Speak with our repair team.</h3>
              <Link className="ca-service__button ca-service__button--gold" href="/contact">Contact CA Autobody <Icon name="arrow-outward" /></Link>
              <a href="tel:+61397727411" className="ca-service__contact-phone">Or call 03 9772 7411 <Icon name="arrow-outward" /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="ca-service__related" aria-labelledby="related-services-heading">
        <div className="shell">
          <div className="ca-service__related-header"><div><span className="ca-service__small-label">CONTINUE EXPLORING</span><h2 id="related-services-heading">More services.</h2></div><Link href="/services">View all services <Icon name="arrow-outward" /></Link></div>
          <div className="ca-service__related-grid">{related.map((item, index) => (
            <Link key={item.slug} href={`/services/${item.slug}`}>
              <span className="ca-service__related-index">0{index + 1}</span>
              <h3>{getEditorialServiceCopy(item.slug)?.title}</h3>
              <Icon name="arrow-outward" className="ca-service__related-arrow" />
            </Link>
          ))}</div>
        </div>
      </section>
    </main>
  );
}

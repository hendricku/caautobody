import Image from "next/image";
import Button from "@/components/UI/Button";
import type { BrandRepairContent } from "@/lib/brandRepairContent";
import ServiceBreadcrumbs from "./ServiceBreadcrumbs";

type Entry = { title: string; copy: string };

function RuledList({ items }: { items: Entry[] }) {
  return <div className="specialist-page__list">{items.map((item, index) => <article key={`${item.title}-${index}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.copy}</p></div></article>)}</div>;
}

export default function SpecialistBrandPage({ content }: { content: BrandRepairContent }) {
  const copy = content.sections;
  const heroImage = (content as BrandRepairContent & { rightImage?: string }).rightImage || content.heroImage;
  return <main className="specialist-page">
    <section className="specialist-page__hero">
      {content.heroImage ? <div className="specialist-page__hero-background" aria-hidden="true"><Image src={content.heroImage} alt="" width={1600} height={900} unoptimized /></div> : null}
      <div className="shell specialist-page__hero-grid">
        <div className="specialist-page__hero-copy">
          <ServiceBreadcrumbs current={content.brand} className="specialist-page__crumbs" />
          <p className="specialist-page__kicker">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className="specialist-page__intro">{content.intro}</p>
          {content.serviceGuideHeading || content.serviceGuideCopy || content.serviceGuide.length ? <div className="specialist-page__guide">
            {content.serviceGuideHeading ? <strong>{content.serviceGuideHeading}</strong> : null}
            {content.serviceGuideCopy ? <p>{content.serviceGuideCopy}</p> : null}
            {content.serviceGuide.length ? <ul>{content.serviceGuide.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : null}
          </div> : null}
          <div className="specialist-page__actions"><Button href="/contact" variant="gold" arrow>{content.assessmentCta}</Button><Button href="tel:+61397727411" variant="outline" arrow>{content.contactCta}</Button></div>
        </div>
        {heroImage ? <div className="specialist-page__hero-image"><Image src={heroImage} alt={content.heroAlt} width={1600} height={1000} priority unoptimized /></div> : null}
      </div>
    </section>
    {(content.approvalTitle || content.approvalCopy || content.approvalPoints.length > 0) ? <section className="specialist-page__approach"><div className="shell specialist-page__split"><div className="specialist-page__section-label">{content.brand}</div><div><p className="specialist-page__kicker">{copy.approvalEyebrow}</p><h2>{content.approvalTitle}</h2><p className="specialist-page__body">{content.approvalCopy}</p>{content.approvalPoints.length ? <ul>{content.approvalPoints.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : null}</div></div></section> : null}
    {content.pillars.length > 0 ? <section className="specialist-page__section shell"><div className="specialist-page__heading"><p className="specialist-page__kicker">{copy.capabilityEyebrow || "Our capabilities"}</p>{copy.capabilityTitle ? <h2>{copy.capabilityTitle}</h2> : null}{copy.capabilityIntro ? <p>{copy.capabilityIntro}</p> : null}</div><RuledList items={content.pillars} /></section> : null}
    {(copy.principlesTitle || content.principles.length > 0) ? <section className="specialist-page__reasons"><div className="shell"><div className="specialist-page__heading"><p className="specialist-page__kicker">{copy.principlesEyebrow}</p><h2>{copy.principlesTitle}</h2></div><RuledList items={content.principles} /></div></section> : null}
    {content.capabilities.length > 0 ? <section className="specialist-page__section shell"><div className="specialist-page__heading"><p className="specialist-page__kicker">{copy.capabilityEyebrow}</p><h2>{copy.capabilityTitle}</h2><p>{copy.capabilityIntro}</p></div><RuledList items={content.capabilities} /></section> : null}
    {(content.systemsTitle || content.systemsCopy || content.media.length > 0) ? <section className="specialist-page__section shell"><div className="specialist-page__heading"><p className="specialist-page__kicker">{copy.systemsEyebrow}</p><h2>{content.systemsTitle}</h2><p className="specialist-page__body">{content.systemsCopy}</p></div>{content.media.length ? <div className="specialist-page__media">{content.media.map((item, index) => <figure key={`${item.image}-${index}`}><Image src={item.image} alt={item.alt} width={1000} height={700} unoptimized />{item.label ? <figcaption>{item.label}</figcaption> : null}</figure>)}</div> : null}</section> : null}
    {content.process.length ? <section className="specialist-page__reasons"><div className="shell"><div className="specialist-page__heading"><p className="specialist-page__kicker">{copy.journeyEyebrow}</p><h2>{copy.journeyTitle}</h2><p>{copy.journeyIntro}</p></div><RuledList items={content.process} /></div></section> : null}
    {content.faqs.length ? <section className="specialist-page__section shell"><div className="specialist-page__heading"><p className="specialist-page__kicker">{copy.faqEyebrow}</p><h2>{copy.faqTitle}</h2></div><div className="specialist-page__faq">{content.faqs.map((item, index) => <details key={`${item.question}-${index}`}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section> : null}
    {(content.review.rating || content.review.quote || content.review.author) ? <section className="specialist-page__section shell"><div className="specialist-page__heading"><p className="specialist-page__kicker">{copy.reviewEyebrow}</p><h2>{copy.reviewTitle}</h2><p>{content.review.rating}</p><blockquote>{content.review.quote}<cite>{content.review.author}</cite></blockquote></div></section> : null}
    {(content.supportTitle || content.supportCopy || content.supportPoints.length > 0) ? <section className="specialist-page__closing"><div className="shell specialist-page__closing-layout"><div className="specialist-page__closing-content"><p className="specialist-page__kicker">{copy.supportEyebrow}</p><h2>{content.supportTitle}</h2><p className="specialist-page__body">{content.supportCopy}</p>{content.supportPoints.length ? <ul>{content.supportPoints.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : null}<div className="specialist-page__actions"><Button href="/contact" variant="gold" arrow>{content.contactCta}</Button><a href="tel:+61397727411">Call 03 9772 7411</a></div>{content.disclaimer ? <p className="specialist-page__disclaimer">{content.disclaimer}</p> : null}</div>{heroImage ? <div className="specialist-page__closing-image"><Image src={heroImage} alt="" width={1000} height={740} unoptimized /></div> : null}</div></section> : null}
    {(copy.finalTitle || copy.finalCopy) ? <section className="specialist-page__section shell"><div className="specialist-page__heading"><p className="specialist-page__kicker">{copy.finalEyebrow}</p><h2>{copy.finalTitle}</h2><p className="specialist-page__body">{copy.finalCopy}</p><Button href="/contact" variant="gold" arrow>{content.contactCta}</Button></div></section> : null}
  </main>;
}

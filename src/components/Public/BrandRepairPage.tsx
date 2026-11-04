import type { CSSProperties } from "react";
import Button from "@/components/UI/Button";
import Image from "next/image";
import { resolveBrandPageTemplate, type BrandRepairContent } from "@/lib/brandRepairContent";
import SpecialistBrandPage from "@/components/Public/SpecialistBrandPage";
import BrandRepairMedia from "@/components/Public/BrandRepairMedia";
import InsurerLogoGrid from "@/components/Public/InsurerLogoGrid";
import { insurers } from "@/lib/siteContent";
import { media } from "@/lib/media";
import FeatureGrid from "./FeatureGrid";
import ServiceBreadcrumbs from "./ServiceBreadcrumbs";

export default function BrandRepairPage({ content }: { content: BrandRepairContent }) {
  if (resolveBrandPageTemplate(content) === "specialist-vehicle") return <SpecialistBrandPage content={content} />;
  return <ApprovedBrandRepairPage content={content} />;
}

function ApprovedBrandRepairPage({ content }: { content: BrandRepairContent }) {
  const copy = content.sections;
  const heroImage = (content as BrandRepairContent & { rightImage?: string }).rightImage
    || (content.brand === "BYD" ? media.heroPanels.byd
      : content.brand === "Lexus" ? media.heroPanels.lexus : content.heroImage);

  const hasPrinciples = Boolean(copy.principlesTitle || content.principles.length);
  const hasCapabilities = Boolean(copy.capabilityTitle || content.capabilities.length);
  const hasSystems = Boolean(content.systemsTitle || content.systemsCopy || content.media.length);
  const hasJourney = Boolean(content.process.length);
  const hasSupport = Boolean(content.supportTitle || content.supportCopy || content.supportPoints.length);
  const hasReview = Boolean(content.review.rating || content.review.quote || content.review.author);
  const hasFinal = Boolean(copy.finalTitle || copy.finalCopy);

  return <main className="brand-repair-page" data-brand={content.brand.toLowerCase()}>
    <section className="brand-hero">
      <div className="brand-hero__background" aria-hidden="true"><Image src={content.heroImage} alt="" width={1600} height={900} priority unoptimized /></div>
      <div className="brand-hero__layout shell">
        <div className="brand-hero__copy">
          <ServiceBreadcrumbs current={content.brand} className="brand-hero__crumbs" />
          <p className="eyebrow light">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className="brand-hero__intro">{content.intro}</p>
          {content.serviceGuide.length ? <div className="brand-hero__guide"><div><span>{content.serviceGuideHeading || "Service guide"}</span>{content.serviceGuideCopy ? <p>{content.serviceGuideCopy}</p> : null}</div><ol>{content.serviceGuide.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol></div> : null}
          <div className="brand-hero__actions"><Button href="/contact" variant="gold" arrow>{content.assessmentCta}</Button><Button href="tel:+61397727411" variant="outline" arrow>{content.contactCta}</Button></div>
        </div>
        <div className="brand-hero__media"><Image src={heroImage} alt={content.heroAlt} fetchPriority="high" width={1600} height={900} unoptimized /></div>
      </div>
    </section>

    <section className="brand-approval section-pad"><div className="shell"><div className="brand-approval__intro">{content.logo ? <div className="brand-approval__logo"><Image src={content.logo} alt={`${content.brand} logo`} width={640} height={288} sizes="(max-width: 720px) 380px, (max-width: 1020px) 480px, 640px" /></div> : <span className="brand-approval__brand-mark">{content.brand}</span>}<div><p className="eyebrow">{copy.approvalEyebrow}</p><h2>{content.approvalTitle}</h2><p>{content.approvalCopy}</p></div></div><FeatureGrid items={content.pillars.map((item) => ({ title: item.title, marker: item.code, content: <p>{item.copy}</p> }))} /></div></section>

    {hasPrinciples ? <section className="brand-principles shell section-pad"><div className="brand-section-heading"><p className="eyebrow">{copy.principlesEyebrow}</p><h2>{copy.principlesTitle}</h2></div><FeatureGrid items={content.principles.map((item) => ({ title: item.title, content: <p>{item.copy}</p> }))} /></section> : null}

    {hasCapabilities ? <section className="brand-capability section-pad"><div className="shell"><div className="brand-section-heading"><p className="eyebrow light">{copy.capabilityEyebrow}</p><h2>{copy.capabilityTitle}</h2><p>{copy.capabilityIntro}</p></div><FeatureGrid tone="dark" items={content.capabilities.map((item) => ({ title: item.title, content: <p>{item.copy}</p> }))} /></div></section> : null}

    {hasSystems ? <section className="brand-systems shell section-pad"><div className="brand-systems__copy"><p className="eyebrow">{copy.systemsEyebrow}</p><h2>{content.systemsTitle}</h2><p>{content.systemsCopy}</p></div>{content.media.length ? <BrandRepairMedia items={content.media} /> : null}</section> : null}

    {hasJourney ? <section className="brand-journey section-pad"><div className="shell"><div className="brand-section-heading"><p className="eyebrow">{copy.journeyEyebrow}</p><h2>{copy.journeyTitle}</h2><p>{copy.journeyIntro}</p></div><ol>{content.process.map((item) => <li key={item.title}><h3>{item.title}</h3><p>{item.copy}</p></li>)}</ol></div></section> : null}

    {hasSupport ? <section className="brand-support section-pad"><div className={`shell brand-support__grid${content.supportPoints.length ? "" : " brand-support__grid--single"}`}><div><p className="eyebrow light">{copy.supportEyebrow}</p><h2>{content.supportTitle}</h2><p>{content.supportCopy}</p><Button href="/contact" variant="gold" arrow>{content.contactCta}</Button></div>{content.supportPoints.length > 0 ? <ul>{content.supportPoints.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div><div className="shell brand-insurers" aria-label="Insurance partners"><InsurerLogoGrid insurers={insurers} className="brand-insurer-grid" /></div>{content.disclaimer ? <div className="shell"><p className="brand-disclaimer"><strong>Important:</strong> {content.disclaimer}</p></div> : null}</section> : null}

    {hasReview ? <section className="brand-review shell section-pad"><p className="eyebrow">{copy.reviewEyebrow}</p><h2>{copy.reviewTitle}</h2><p className="brand-review__rating">{content.review.rating}</p><blockquote>{"\u201c"}{content.review.quote}{"\u201d"}<cite>{content.review.author}</cite></blockquote></section> : null}

    {hasFinal ? <section className="brand-final dark-context-surface dark-context-surface--brand" style={{ "--dark-context-image": `url("${content.heroImage}")` } as CSSProperties}><div className="shell"><p className="eyebrow light">{copy.finalEyebrow}</p><h2>{copy.finalTitle}</h2><p>{copy.finalCopy}</p><div><Button href="/contact" variant="gold" arrow>{content.contactCta}</Button><a href="tel:+61397727411">Call 03 9772 7411</a></div></div></section> : null}
  </main>;
}

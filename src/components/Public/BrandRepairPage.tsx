import type { CSSProperties } from "react";
import Button from "@/components/UI/Button";
import Image from "next/image";
import type { BrandRepairContent } from "@/lib/brandRepairContent";
import BrandRepairMedia from "@/components/Public/BrandRepairMedia";
import InsurerLogoGrid from "@/components/Public/InsurerLogoGrid";
import { insurers } from "@/lib/siteContent";
import { media } from "@/lib/media";
import BrandAssessmentForm from "@/components/Public/BrandAssessmentForm";
import FeatureGrid from "./FeatureGrid";
import ServiceBreadcrumbs from "./ServiceBreadcrumbs";

export default function BrandRepairPage({ content }: { content: BrandRepairContent }) {
  const copy = content.sections;
  const heroImage = content.brand === "BYD"
    ? media.heroPanels.byd
    : content.brand === "Lexus"
      ? media.heroPanels.lexus
      : content.heroImage;

  return <main className="brand-repair-page" data-brand={content.brand.toLowerCase()}>
    <section className="brand-hero"><div className="brand-hero__background" aria-hidden="true"><img src={content.heroImage} alt="" /></div><div className="brand-hero__layout shell"><div className="brand-hero__copy"><ServiceBreadcrumbs current={content.brand} className="brand-hero__crumbs" /><p className="eyebrow light">{content.eyebrow}</p><h1>{content.title}</h1><p className="brand-hero__intro">{content.intro}</p><p className="brand-hero__guide"><span>Service guide</span>{content.serviceGuide.map((item, index) => <span key={item}>{String(index + 1).padStart(2, "0")} {item}</span>)}</p><a className="brand-hero__call" href="tel:+61397727411">Call 03 9772 7411</a></div><div className="brand-hero__media"><img src={heroImage} alt={content.heroAlt} fetchPriority="high" /></div></div></section>

    <section className="brand-assessment-intake" aria-label={`${content.brand} repair assessment`}><div className="shell brand-assessment-intake__layout"><div><p className="eyebrow">Repair assessment</p><h2>Tell us what happened.</h2><p>Share the damage details and our team will advise the best next step for your vehicle.</p></div><BrandAssessmentForm brand={content.brand} cta={content.assessmentCta} assessmentNote={copy.assessmentNote} /></div></section>

    <section className="brand-approval section-pad"><div className="shell"><div className="brand-approval__intro">{content.logo ? <div className="brand-approval__logo"><Image src={content.logo} alt={`${content.brand} logo`} width={640} height={288} sizes="(max-width: 720px) 380px, (max-width: 1020px) 480px, 640px" /></div> : <span className="brand-approval__brand-mark">{content.brand}</span>}<div><p className="eyebrow">{copy.approvalEyebrow}</p><h2>{content.approvalTitle}</h2><p>{content.approvalCopy}</p></div></div><FeatureGrid items={content.pillars.map((item) => ({ title: item.title, marker: item.code, content: <p>{item.copy}</p> }))} /></div></section>

    <section className="brand-principles shell section-pad"><div className="brand-section-heading"><p className="eyebrow">{copy.principlesEyebrow}</p><h2>{copy.principlesTitle}</h2></div><FeatureGrid items={content.principles.map((item) => ({ title: item.title, content: <p>{item.copy}</p> }))} /></section>

    <section className="brand-capability section-pad"><div className="shell"><div className="brand-section-heading"><p className="eyebrow light">{copy.capabilityEyebrow}</p><h2>{copy.capabilityTitle}</h2><p>{copy.capabilityIntro}</p></div><FeatureGrid tone="dark" items={content.capabilities.map((item) => ({ title: item.title, content: <p>{item.copy}</p> }))} /></div></section>

    <section className="brand-systems shell section-pad"><div className="brand-systems__copy"><p className="eyebrow">{copy.systemsEyebrow}</p><h2>{content.systemsTitle}</h2><p>{content.systemsCopy}</p></div><BrandRepairMedia items={content.media} /></section>

    <section className="brand-journey section-pad"><div className="shell"><div className="brand-section-heading"><p className="eyebrow">{copy.journeyEyebrow}</p><h2>{copy.journeyTitle}</h2><p>{copy.journeyIntro}</p></div><ol>{content.process.map((item) => <li key={item.title}><h3>{item.title}</h3><p>{item.copy}</p></li>)}</ol></div></section>

    <section className="brand-support section-pad"><div className={`shell brand-support__grid${content.supportPoints.length ? "" : " brand-support__grid--single"}`}><div><p className="eyebrow light">{copy.supportEyebrow}</p><h2>{content.supportTitle}</h2><p>{content.supportCopy}</p><Button href="/contact" variant="gold" arrow>{content.contactCta}</Button></div>{content.supportPoints.length > 0 ? <ul>{content.supportPoints.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div><div className="shell brand-insurers" aria-label="Insurance partners"><InsurerLogoGrid insurers={insurers} className="brand-insurer-grid" /></div><div className="shell"><p className="brand-disclaimer"><strong>Important:</strong> {content.disclaimer}</p></div></section>

    <section className="brand-review shell section-pad"><p className="eyebrow">{copy.reviewEyebrow}</p><h2>{copy.reviewTitle}</h2><p className="brand-review__rating">{content.review.rating}</p><blockquote>{"\u201c"}{content.review.quote}{"\u201d"}<cite>{content.review.author}</cite></blockquote></section>

    <section className="brand-final dark-context-surface dark-context-surface--brand" style={{ "--dark-context-image": `url("${content.heroImage}")` } as CSSProperties}><div className="shell"><p className="eyebrow light">{copy.finalEyebrow}</p><h2>{copy.finalTitle}</h2><p>{copy.finalCopy}</p><div><Button href="/contact" variant="gold" arrow>{content.contactCta}</Button><a href="tel:+61397727411">Call 03 9772 7411</a></div></div></section>
  </main>;
}

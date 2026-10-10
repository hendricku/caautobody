import Button from "@/components/UI/Button";
import type { BrandRepairContent } from "@/lib/brandRepairContent";
import BrandRepairMedia from "@/components/Public/BrandRepairMedia";
import InsurerLogoGrid from "@/components/Public/InsurerLogoGrid";
import { insurers } from "@/lib/siteContent";
import BrandAssessmentForm from "@/components/Public/BrandAssessmentForm";

export default function BrandRepairPage({ content }: { content: BrandRepairContent }) {
  const copy = content.sections;

  return <main className="brand-repair-page">
    <section className="brand-hero"><img src={content.heroImage} alt={content.heroAlt} /><div className="brand-hero__shade" aria-hidden="true" /><div className="brand-hero__layout shell"><div className="brand-hero__copy"><p className="eyebrow light">{content.eyebrow}</p><h1>{content.title}</h1><p className="brand-hero__intro">{content.intro}</p><ul>{content.approvalPoints.map((point) => <li key={point}>{point}</li>)}</ul><a className="brand-hero__call" href="tel:+61397727411">Call 03 9772 7411</a></div><BrandAssessmentForm brand={content.brand} cta={content.assessmentCta} assessmentNote={copy.assessmentNote} /></div></section>

    <section className="brand-approval section-pad"><div className="shell"><div className="brand-approval__intro">{content.logo ? <img src={content.logo} alt={`${content.brand} approved repairer`} /> : <span className="brand-approval__brand-mark">{content.brand}</span>}<div><p className="eyebrow">{copy.approvalEyebrow}</p><h2>{content.approvalTitle}</h2><p>{content.approvalCopy}</p></div></div><div className="brand-pillars">{content.pillars.map((item) => <article key={item.title}><span>{item.code}</span><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div></div></section>

    <section className="brand-principles shell section-pad"><div className="brand-section-heading"><p className="eyebrow">{copy.principlesEyebrow}</p><h2>{copy.principlesTitle}</h2></div><ol>{content.principles.map((item) => <li key={item.title}><h3>{item.title}</h3><p>{item.copy}</p></li>)}</ol></section>

    <section className="brand-capability section-pad"><div className="shell"><div className="brand-section-heading"><p className="eyebrow light">{copy.capabilityEyebrow}</p><h2>{copy.capabilityTitle}</h2><p>{copy.capabilityIntro}</p></div><ol>{content.capabilities.map((item) => <li key={item.title}><h3>{item.title}</h3><p>{item.copy}</p></li>)}</ol></div></section>

    <section className="brand-systems shell section-pad"><div className="brand-systems__copy"><p className="eyebrow">{copy.systemsEyebrow}</p><h2>{content.systemsTitle}</h2><p>{content.systemsCopy}</p></div><BrandRepairMedia items={content.media} /></section>

    <section className="brand-journey section-pad"><div className="shell"><div className="brand-section-heading"><p className="eyebrow">{copy.journeyEyebrow}</p><h2>{copy.journeyTitle}</h2><p>{copy.journeyIntro}</p></div><ol>{content.process.map((item) => <li key={item.title}><h3>{item.title}</h3><p>{item.copy}</p></li>)}</ol></div></section>

    <section className="brand-support section-pad"><div className="shell brand-support__grid"><div><p className="eyebrow light">{copy.supportEyebrow}</p><h2>{content.supportTitle}</h2><p>{content.supportCopy}</p><Button href="/contact" variant="gold" arrow>{content.assessmentCta}</Button></div><ul>{content.supportPoints.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="shell brand-insurers" aria-label="Insurance partners"><InsurerLogoGrid insurers={insurers} className="brand-insurer-grid" /></div><div className="shell"><p className="brand-disclaimer"><strong>Important:</strong> {content.disclaimer}</p></div></section>

    <section className="brand-review shell section-pad"><p className="eyebrow">{copy.reviewEyebrow}</p><h2>{copy.reviewTitle}</h2><p className="brand-review__rating">{content.review.rating}</p><blockquote>{"\u201c"}{content.review.quote}{"\u201d"}<cite>{content.review.author}</cite></blockquote></section>

    <section className="brand-final"><div className="shell"><p className="eyebrow light">{copy.finalEyebrow}</p><h2>{copy.finalTitle}</h2><p>{copy.finalCopy}</p><div><Button href="/contact" variant="gold" arrow>{content.assessmentCta}</Button><a href="tel:+61397727411">Call 03 9772 7411</a></div></div></section>
  </main>;
}

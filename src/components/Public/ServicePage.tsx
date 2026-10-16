import Button from "@/components/UI/Button";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { CmsServiceContent } from "@/lib/cms/public-content";
import PageHero from "@/components/Common/PageHero";
import { services } from "@/lib/siteContent";
import BrandRepairPage from "@/components/Public/BrandRepairPage";
import { brandRepairContent } from "@/lib/brandRepairContent";
import SourceServicePage from "@/components/Public/SourceServicePage";
import EditorialServicePage from "@/components/Public/EditorialServicePage";
import { getApprovedBrandServiceCopy, getEditorialServiceCopy } from "@/lib/originalServiceCopy";

const repairSteps = [
  ["Assessment", "Inspect damage and identify the repair pathway."],
  ["Approval", "Confirm scope, insurer steps and repair timing."],
  ["Repair", "Complete body, paint and associated repair work."],
  ["Quality check", "Final inspection before vehicle handover."],
];

export default function ServicePage({ service }: { service: CmsServiceContent }) {
  const exactCopy = getApprovedBrandServiceCopy(service.slug)
    ?? (service.presentation?.variant === "editorial" ? service.presentation.data : getEditorialServiceCopy(service.slug));
  if (exactCopy) return <EditorialServicePage service={service} copy={exactCopy} />;
  const brandContent = service.presentation?.variant === "brand" ? service.presentation.data : service.presentation ? undefined : brandRepairContent[service.slug];
  if (brandContent) return <BrandRepairPage content={brandContent} />;
  if (!service.contentPending) return <SourceServicePage service={service} />;

  return (
    <main>
      <PageHero eyebrow="CA Autobody Service" title={service.title} image={service.image} intro={service.intro} />

      <section className="service-overview shell section-pad hp-reveal" aria-labelledby="service-overview-title">
        <div><span className="eyebrow">{service.eyebrow}</span><h2 id="service-overview-title">Clear repair support from the first assessment.</h2></div>
        <div className="copy-stack">{service.contentPending ? <p className="service-content-note">Brand-specific content is being prepared and will be published after client approval.</p> : null}{service.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Button href="/contact" variant="black" arrow>Book a service</Button></div>
      </section>

      <section className="service-focus section-pad dark-context-surface dark-context-surface--service" style={{ "--dark-context-image": `url("${service.image}")` } as CSSProperties}>
        <div className="shell service-focus__grid hp-reveal">
          <div><span className="eyebrow light">What we focus on</span><h2>What this service includes.</h2></div>
          <ul>{service.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="service-process shell section-pad" aria-labelledby="service-process-title">
        <div className="service-process__head hp-reveal"><span className="eyebrow">Our process</span><h2 id="service-process-title">Simple, transparent and repair-focused.</h2></div>
        <ol className="service-process__list hp-reveal">{repairSteps.map(([title, copy]) => <li key={title}><span aria-hidden="true" /><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
      </section>

      <section className="service-related section-pad">
        <div className="shell">
          <div className="service-related__head hp-reveal"><div><span className="eyebrow">Related services</span><h2>Explore more repair support.</h2></div><Link className="text-link" href="/services">All services <span aria-hidden="true">→</span></Link></div>
          <div className="service-related__list hp-reveal">{services.filter((item) => item.slug !== service.slug).slice(0, 3).map((item) => <Link key={item.slug} href={`/services/${item.slug}`}><span>{item.title}</span><b aria-hidden="true">→</b></Link>)}</div>
        </div>
      </section>
    </main>
  );
}

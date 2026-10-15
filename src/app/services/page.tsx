import type { Metadata } from "next";
import Link from "next/link";
import { originalServiceCopy } from "@/lib/originalServiceCopy";
import { getPublishedServices } from "@/lib/cms/public-content";
import { media } from "@/lib/media";

export const metadata: Metadata = { title: "Auto Accident Repair Services Melbourne | CA Autobody" };

export default async function ServicesPage() {
  const services = await getPublishedServices();
  const originalServices = services.filter((service) => Boolean(originalServiceCopy[service.slug]));
  const otherServices = services.filter((service) => !originalServiceCopy[service.slug]);
  return <main className="ca-services-landing">
    <section className="ca-services-landing__hero" aria-labelledby="services-title">
      <img src={media.hero.services} alt="" aria-hidden="true" fetchPriority="high" />
      <div className="shell ca-services-landing__hero-inner">
        <span className="ca-services-landing__eyebrow">CA CHELSEA AUTOBODY <span>/</span> OUR SERVICES</span>
        <h1 id="services-title">Expert care, for every repair.</h1>
        <p>Auto accident repair services in Melbourne</p>
        <div className="ca-services-landing__hero-line" aria-hidden="true" />
      </div>
    </section>

    <section className="ca-services-landing__intro shell" aria-labelledby="services-intro-title">
      <div>
        <span className="ca-services-landing__label">WHAT WE DO / MELBOURNE</span>
        <h2 id="services-intro-title">The right expertise, all in one place.</h2>
      </div>
      <p>One experienced workshop for accident damage, body repairs, refinishing, replacement transport and modern EV repair support. Choose the service that best matches your needs.</p>
    </section>

    <section className="ca-services-landing__catalogue" aria-labelledby="services-catalogue-title">
      <div className="shell">
        <div className="ca-services-landing__catalogue-head"><span className="ca-services-landing__label">SERVICE DIRECTORY</span><h2 id="services-catalogue-title">Explore our services</h2><span>{String(originalServices.length).padStart(2,"0")} core services</span></div>
        <div className="ca-services-landing__grid">
          {originalServices.map((service, index) => {
            const copy = originalServiceCopy[service.slug];
            return <Link className={`ca-services-landing__card${index === 0 || index === 5 ? " ca-services-landing__card--wide" : ""}`} href={`/services/${service.slug}`} key={service.slug} aria-label={`Explore ${copy.title}`}>
              <div className="ca-services-landing__card-media"><img src={service.image} alt="" loading="lazy" /><span className="ca-services-landing__card-index">{String(index+1).padStart(2,"0")} / {String(originalServices.length).padStart(2,"0")}</span></div>
              <div className="ca-services-landing__card-copy"><div><span className="ca-services-landing__card-category">REPAIR SERVICES / MELBOURNE</span><h3>{copy.title}</h3><p>{copy.introParagraphs[0]}</p></div><span className="ca-services-landing__card-action">Explore service <span aria-hidden="true">↗</span></span></div>
            </Link>;
          })}
        </div>
      </div>
    </section>

    {otherServices.length > 0 && <section className="ca-services-landing__additional shell" aria-labelledby="services-additional-heading">
      <div className="ca-services-landing__additional-heading"><span className="ca-services-landing__label">SPECIALIST REPAIR SUPPORT</span><h2 id="services-additional-heading">More approved repair options.</h2></div>
      <div className="ca-services-landing__additional-list">{otherServices.map((service, index) => <Link key={service.slug} href={`/services/${service.slug}`}><span>{String(index+1).padStart(2,"0")}</span><strong>{service.title}</strong><span aria-hidden="true">↗</span></Link>)}</div>
    </section>}

    <section className="services-reassurance">
      <div className="shell services-reassurance__grid">
        <div><span className="eyebrow light">One repair team</span><h2>A clear path from assessment to handover.</h2></div>
        <ol className="services-reassurance__points"><li>Assessment</li><li>Repair planning</li><li>Body and paint work</li><li>Quality handover</li></ol>
      </div>
    </section>
  </main>;
}

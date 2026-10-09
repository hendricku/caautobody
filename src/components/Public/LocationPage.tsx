import Button from "@/components/UI/Button";
import Link from "next/link";
import PageHero from "@/components/Common/PageHero";
import type { LocationContent } from "@/types/content";
import { services } from "@/lib/siteContent";

export default function LocationPage({ location }: { location: LocationContent }) {
  return (
    <main>
      <PageHero eyebrow="Areas We Serve" title={`Smash Repairs ${location.name}`} image={location.image} intro={location.intro} />
      <section className="editorial-grid shell section-pad hp-reveal"><div><span className="eyebrow">Local repair support</span><h2>Professional panel and collision repair near {location.name}.</h2></div><div className="copy-stack">{location.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Button href="/contact" variant="black" arrow>Request an assessment</Button></div></section>
      <section className="location-services section-pad"><div className="shell"><div className="section-heading split-heading"><div><span className="eyebrow light">Repair services</span><h2>One workshop for the complete repair journey.</h2></div><p>Our Chelsea Heights facility supports drivers across Melbourne's south-east with body, paint, accident assistance and modern EV repair services.</p></div><div className="simple-service-list hp-reveal">{services.slice(0,6).map((service) => <Link key={service.slug} href={`/services/${service.slug}`}><span>{service.title}</span><b>→</b></Link>)}</div></div></section>
    </main>
  );
}

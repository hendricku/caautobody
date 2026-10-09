import Link from "next/link";
import type { ReactNode } from "react";
import Button from "@/components/UI/Button";
import PageHero from "@/components/Common/PageHero";
import { services } from "@/lib/siteContent";
import { originalServiceCopy, type ServiceBlock } from "@/lib/originalServiceCopy";
import type { ServiceContent } from "@/types/content";

const cleanSourceText = (value: string) => value
  .replaceAll("â€™", "’")
  .replaceAll("â€œ", "“")
  .replaceAll("â€�", "”")
  .replaceAll("â€“", "–")
  .replaceAll("â€”", "—")
  .replaceAll("Â", "");

function SourceBlocks({ blocks }: { blocks: ServiceBlock[] }) {
  const output: ReactNode[] = [];
  let bullets: string[] = [];
  const flushBullets = () => {
    if (!bullets.length) return;
    output.push(<ul key={`list-${output.length}`}>{bullets.map((bullet) => <li key={bullet}>{cleanSourceText(bullet)}</li>)}</ul>);
    bullets = [];
  };

  blocks.forEach((block, index) => {
    if (block.type === "bullet") {
      bullets.push(block.text);
      return;
    }
    flushBullets();
    if (block.type === "subheading") output.push(<h3 key={`${block.text}-${index}`}>{cleanSourceText(block.text)}</h3>);
    else output.push(<p key={`${block.text}-${index}`}>{cleanSourceText(block.text)}</p>);
  });
  flushBullets();
  return <>{output}</>;
}

export default function SourceServicePage({ service }: { service: ServiceContent }) {
  const source = originalServiceCopy[service.slug];
  const imagePositions: Record<string, string> = {
    "spray-painting": "center 52%",
    "panel-beating": "center 54%",
    "paintless-dent-removal": "center 50%",
    "replacement-vehicles": "center 48%",
    "accident-assistance": "center 50%",
    "tesla-approved-repair-centre": "center 52%",
    "services-zeekr-approved-repairer-melbourne": "center 50%",
  };
  const relatedServices = services
    .filter((item) => item.slug !== service.slug && !["byd-approved-repairer-melbourne", "lexus-approved-body-shop-melbourne"].includes(item.slug))
    .slice(0, 3);

  return (
    <main className="source-service">
      <PageHero title={source?.title ?? service.title} image={service.image} intro={source ? cleanSourceText(source.introParagraphs[0]) : service.intro} variant="service" imagePosition={imagePositions[service.slug]} />

      <section className="source-service__story shell section-pad" aria-label={source?.title ?? service.title}>
        <article className="source-service__copy hp-reveal">
          {(source?.introParagraphs.slice(1) ?? service.body).map((paragraph) => <p className="source-service__lead" key={paragraph}>{cleanSourceText(paragraph)}</p>)}
          {source?.sections.map((section) => (
            <section className="source-service__section" key={section.heading}>
              <h2>{cleanSourceText(section.heading)}</h2>
              <SourceBlocks blocks={section.blocks} />
            </section>
          ))}
        </article>
        <aside className="source-service__contact hp-reveal" aria-label="Contact CA Autobody">
          <span>CA Autobody</span>
          <a href="tel:+61397727411">03 9772 7411</a>
          <p>7 Ashley Park Drive, Chelsea Heights, VIC 3196</p>
          <Button href="/contact" variant="gold" arrow>Contact us</Button>
        </aside>
      </section>

      {source?.faqs.length ? <section className="source-service__faq section-pad" aria-labelledby="service-faq-title"><div className="shell"><div className="source-service__faq-heading hp-reveal"><h2 id="service-faq-title">{cleanSourceText(source.faqHeading || "Frequently Asked Questions")}</h2>{source.faqIntro.map((paragraph) => <p key={paragraph}>{cleanSourceText(paragraph)}</p>)}</div><div className="source-service__faq-list hp-reveal">{source.faqs.map((faq) => <details key={faq.question}><summary>{cleanSourceText(faq.question)}<span aria-hidden="true">+</span></summary><p>{cleanSourceText(faq.answer)}</p></details>)}</div><Link className="text-link source-service__faq-link" href={`/frequently-asked-questions?category=${encodeURIComponent(source.category)}`}>View all {source.category} questions <span aria-hidden="true">→</span></Link></div></section> : null}

      <section className="source-service__related section-pad">
        <div className="shell">
          <div className="source-service__related-head hp-reveal">
            <h2>More repair services</h2>
            <Link className="text-link" href="/services">View all services <span aria-hidden="true">→</span></Link>
          </div>
          <nav className="source-service__related-list hp-reveal" aria-label="Related services">
            {relatedServices.map((item) => (
              <Link key={item.slug} href={`/services/${item.slug}`}>
                <span>{item.title}</span><b aria-hidden="true">→</b>
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import AdsAssessmentForm from "@/components/Public/AdsAssessmentForm";
import type { AdsLandingPage as Content, OfferItem } from "@/lib/ads-landing-pages";
import { media } from "@/lib/media";
import type { OfferSection } from "@/types/content";

const phoneHref = "tel:0397727411";
const workshop = "7 Ashley Park Drive, Chelsea Heights VIC 3196";

function Cards({ items, numbered = false }: { items: OfferItem[]; numbered?: boolean }) {
  return <div className={numbered ? "ads-numbered" : "ads-cards"}>{items.map((item, index) => <article key={item.title}>
    {numbered ? <b>{String(index + 1)}</b> : item.code ? <b>{item.code}</b> : null}
    <div><h3>{item.title}</h3><p>{item.copy}</p></div>
  </article>)}</div>;
}

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return <header className="ads-section-heading"><p>{eyebrow}</p><h2>{title}</h2>{intro ? <span>{intro}</span> : null}</header>;
}

function CustomSection({ section }: { section: OfferSection }) {
  if (section.type === "faq") return <section className="ads-section ads-section--faq"><div className="ads-shell ads-faq"><SectionHeading eyebrow={section.eyebrow || "COMMON QUESTIONS"} title={section.title} intro={section.copy} />{(section.items || []).map((item) => <details key={item.title}><summary>{item.title}</summary><p>{item.copy}</p></details>)}</div></section>;
  if (section.type === "steps") return <section className="ads-section"><div className="ads-shell"><SectionHeading eyebrow={section.eyebrow || "REPAIR PROCESS"} title={section.title} intro={section.copy} /><Cards items={section.items || []} numbered /></div></section>;
  if (section.type === "cta") return <section className="ads-final"><div className="ads-shell ads-final__grid"><div><p>{section.eyebrow || "READY TO START?"}</p><h2>{section.title}</h2><span>{section.copy}</span><div><a href="#assessment">Start my repair assessment</a><a href={phoneHref}>Call 03 9772 7411</a></div></div><aside><p>WORKSHOP</p><strong>{workshop}</strong><p>EMAIL</p><a href="mailto:info@caautobody.com.au">info@caautobody.com.au</a></aside></div></section>;
  return <section className="ads-section"><div className="ads-shell ads-approval"><div className="ads-approval__intro"><SectionHeading eyebrow={section.eyebrow || "CA AUTOBODY"} title={section.title} /><p>{section.copy}</p></div>{section.image ? <div className="ads-approval__image"><Image src={section.image} alt={section.imageAlt || "CA Autobody repair work"} fill sizes="(max-width: 900px) 100vw, 50vw" /></div> : null}</div></section>;
}

export default function AdsLandingPage({ page }: { page: Content }) {
  return <main className="ads-page">
    <a className="ads-skip" href="#offer-main">Skip to content</a>
    <header className="ads-header">
      <div className="ads-shell ads-header__inner">
        <Link href="/" className="ads-header__logo" aria-label="CA Autobody home"><Image src={media.logo} alt="CA Autobody" width={104} height={86} priority /></Link>
        <div className="ads-header__actions"><a className="ads-header__call" href={phoneHref}>Immediate assistance: 03 9772 7411</a><a className="ads-header__cta" href="#assessment">Start My Repair Assessment</a></div>
      </div>
    </header>

    <div id="offer-main">
      <section className="ads-hero">
        <Image className="ads-hero__image" src={page.heroImage} alt={page.heroAlt} fill priority sizes="100vw" />
        <div className="ads-hero__shade" />
        <div className="ads-shell ads-hero__inner">
          <div className="ads-hero__copy">
            <p>{page.eyebrow}</p><h1>{page.title}</h1><span>{page.intro}</span>
            <ul>{page.heroProof.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="ads-hero__buttons"><a href="#assessment">{page.primaryCta}</a><a href={phoneHref}>Call 03 9772 7411</a></div>
          </div>
          <div id="assessment"><AdsAssessmentForm page={page} /></div>
        </div>
      </section>

      <section className="ads-proof-section" aria-label="Repair support highlights">
        <div className="ads-shell">
          <div className="ads-proof">{page.proof.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.copy}</p></article>)}</div>
        </div>
      </section>

      <section className="ads-section">
        <div className="ads-shell">
          <div className="ads-approval">
            <div className="ads-approval__intro"><SectionHeading eyebrow={page.overview.eyebrow} title={page.overview.title} /><p>{page.overview.copy}</p></div>
            <div className="ads-approval__image"><Image src={page.overview.image.src} alt={page.overview.image.alt} fill sizes="(max-width: 760px) 100vw, 40vw" />{page.overview.image.caption ? <small>{page.overview.image.caption}</small> : null}</div>
          </div>
          <Cards items={page.overview.points} />
        </div>
      </section>

      <section className="ads-section ads-section--tone">
        <div className="ads-shell">
          <SectionHeading {...page.principles} />
          <Cards items={page.principles.items} numbered />
          {page.systems ? <div className="ads-systems">
            <div className="ads-systems__image"><Image src={page.systems.image.src} alt={page.systems.image.alt} fill sizes="(max-width: 760px) 100vw, 44vw" /></div>
            <div><SectionHeading eyebrow={page.systems.eyebrow} title={page.systems.title} /><p>{page.systems.copy}</p></div>
          </div> : null}
        </div>
      </section>

      <section className="ads-section">
        <div className="ads-shell"><SectionHeading {...page.capability} /><Cards items={page.capability.items} numbered /></div>
      </section>

      {page.customSections?.map((section) => <CustomSection key={section.id} section={section} />)}

      <section className="ads-section ads-section--tone">
        <div className="ads-shell ads-journey">
          <div><SectionHeading {...page.journey} /><Cards items={page.journey.items} numbered /></div>
          <aside><p>{page.support.eyebrow}</p><h2>{page.support.title}</h2><span>{page.support.copy}</span><ul>{page.support.items.map((item) => <li key={item}>{item}</li>)}</ul><a href="#assessment">{page.primaryCta}</a></aside>
          <p className="ads-disclaimer"><strong>IMPORTANT:</strong> {page.disclaimer}</p>
        </div>
      </section>

      {page.protect ? <section className="ads-section">
        <div className="ads-shell ads-protect">
          <SectionHeading eyebrow={page.protect.eyebrow} title={page.protect.title} intro={page.protect.intro} />
          <div className={page.protect.image ? "ads-protect__grid" : ""}>
            {page.protect.image ? <div className="ads-protect__image"><Image src={page.protect.image.src} alt={page.protect.image.alt} fill sizes="(max-width: 760px) 100vw, 40vw" /></div> : null}
            <Cards items={page.protect.items} numbered />
          </div>
        </div>
      </section> : null}

      <section className="ads-section ads-section--faq">
        <div className="ads-shell ads-faq">
          <SectionHeading eyebrow="QUESTIONS ANSWERED" title="Answers before you book your repair" />
          {page.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </div>
      </section>

      <section className="ads-section">
        <div className="ads-shell ads-review"><p>WHAT OUR CUSTOMERS SAY</p><h2>Rated <em>4.9</em> by Melbourne motorists</h2><article><span>★★★★★</span><blockquote>{page.review.quote}</blockquote><small>{page.review.author} · Google review</small></article></div>
      </section>

      <section className="ads-final"><div className="ads-shell ads-final__grid">
        <div><p>{page.final.eyebrow}</p><h2>{page.final.title}</h2><span>{page.final.copy}</span><div><a href="#assessment">{page.primaryCta}</a><a href={phoneHref}>Call 03 9772 7411</a></div></div>
        <aside><p>WORKSHOP</p><strong>{workshop}</strong><p>EMAIL</p><a href="mailto:info@caautobody.com.au">info@caautobody.com.au</a><p>HOURS</p><strong>Monday to Friday, 8:00 am to 5:00 pm</strong></aside>
      </div></section>
    </div>

    <footer className="ads-footer"><div className="ads-shell"><p>© 2026 CA Autobody. Chelsea Heights, Victoria.</p><nav aria-label="Legal"><Link href="/privacy-policy">Privacy policy</Link><Link href="/contact">Contact</Link></nav></div></footer>
  </main>;
}

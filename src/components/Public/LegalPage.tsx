import Link from "next/link";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  points?: string[];
};

export default function LegalPage({ title, eyebrow, description, sections, counterpart }: {
  title: string;
  eyebrow: string;
  description: string;
  sections: LegalSection[];
  counterpart: { label: string; href: string };
}) {
  return (
    <main className="ca-legal">
      <header className="ca-legal__hero">
        <div className="shell">
          <p className="ca-legal__eyebrow">CA AUTOBODY / {eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="shell ca-legal__body">
        <aside className="ca-legal__aside">
          <strong>CA AUTOBODY</strong>
          <p>Clear information, available when you need it.</p>
          <a href="mailto:info@caautobody.com.au">info@caautobody.com.au</a>
          <a href="tel:+61397727411">03 9772 7411</a>
        </aside>
        <article className="ca-legal__article" aria-label={`${title} details`}>
          {sections.map((section, index) => (
            <details id={section.id} key={section.id} className="ca-legal__section" open={index === 0}>
              <summary>
                <span className="ca-legal__section-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="ca-legal__section-title">{section.title}</span>
                <span className="ca-legal__section-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="ca-legal__section-content">
                {section.paragraphs?.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                {section.points?.length ? <ul>{section.points.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}</ul> : null}
              </div>
            </details>
          ))}
        </article>
      </div>
      <div className="ca-legal__end">
        <div className="shell ca-legal__end-inner">
          <h2>Need more information?</h2>
          <div><Link href="/contact">Contact our team ↗</Link> <span aria-hidden="true">&nbsp;&nbsp; / &nbsp;&nbsp;</span> <Link href={counterpart.href}>{counterpart.label} ↗</Link></div>
        </div>
      </div>
    </main>
  );
}

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
        <nav aria-label="On this page" className="ca-legal__aside">
          <strong>ON THIS PAGE</strong>
          {sections.map((section, index) => <a href={`#${section.id}`} key={section.id}>{String(index + 1).padStart(2, "0")} / {section.title}</a>)}
        </nav>
        <article className="ca-legal__article">
          {sections.map((section) => (
            <section id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {section.paragraphs?.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.points?.length ? <ul>{section.points.map((point, index) => <li key={index}>{point}</li>)}</ul> : null}
            </section>
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

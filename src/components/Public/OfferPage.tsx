import Button from "@/components/UI/Button";
import Link from "next/link";
import PageHero from "@/components/Common/PageHero";
import type { OfferContent } from "@/types/content";

export default function OfferPage({ offer }: { offer: OfferContent }) {
  return (
    <main>
      <PageHero eyebrow={offer.eyebrow} title={offer.title} image={offer.image} intro={offer.intro} />
      <section className="editorial-grid shell section-pad hp-reveal"><div><span className="eyebrow">Specialist repair support</span><h2>Premium repair coordination without unnecessary complexity.</h2></div><div className="copy-stack">{offer.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Button href="/contact" variant="black" arrow>Speak with the workshop</Button></div></section>
      <section className="offer-steps section-pad"><div className="shell"><div className="section-heading dark-text"><span className="eyebrow">How we work</span><h2>A clear path from first contact to handover.</h2></div><div className="focus-grid light-cards hp-reveal">{offer.bullets.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item}</h3></article>)}</div></div></section>
    </main>
  );
}

import Button from "@/components/UI/Button";

export default function InnerFinalCTA() {
  return (
    <section className="inner-final-cta hp-section--black dark-context-surface dark-context-surface--cta" aria-labelledby="inner-final-cta-title">
      <div className="hp-shell inner-final-cta__inner hp-reveal">
        <div className="inner-final-cta__lead">
          <span className="hp-eyebrow hp-eyebrow--light">After an accident</span>
          <h2 id="inner-final-cta-title">Start your repair with a quick call.</h2>
        </div>
        <div className="inner-final-cta__contact">
          <p>Talk to the Chelsea Heights team about the next step, your insurer, or arranging a repair assessment.</p>
          <div className="inner-final-cta__actions">
            <Button href="tel:+61397727411" variant="ghost-light">Call 03 9772 7411</Button>
            <Button href="/contact" variant="gold" arrow>Book a repair assessment</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

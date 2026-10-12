import Link from "next/link";
import Button from "@/components/UI/Button";
import ServiceExperience from "@/components/Public/V4/ServiceExperience";
import InsurerLogoGrid from "@/components/Public/InsurerLogoGrid";
import { insurers } from "@/lib/siteContent";
import { media, vehicleBrandLogos } from "@/lib/media";

export default function HomeV4() {
  return (
    <main className="v4-home">
      <section className="hp-hero" aria-labelledby="hero-title">
        <div className="hp-hero__media" aria-hidden="true" />
        <div className="hp-hero__top-fade" aria-hidden="true" />
        <div className="hp-hero__content hp-shell">
          <span className="hp-eyebrow">Melbourne’s trusted smash repair specialists</span>
          <h1 id="hero-title"><span>Quality repairs. Honest service.</span><em>Peace of mind.</em></h1>
          <p>We make the smash repair process simple — from the first call and insurance support through to quality repair work and getting you safely back on the road.</p>
          <div className="hp-hero__actions">
            <Button href="/contact" variant="gold" arrow>Get a Free Quote</Button>
            <Button href="tel:+61397727411" variant="hero-secondary" className="hp-btn--phone">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 2.7 10 6l-2.1 2.1c1.1 2.3 2.9 4.1 5.2 5.2l2.1-2.1 3.3 3.3-1.7 2.5c-.5.8-1.5 1.2-2.4 1C8.6 17 4 12.4 3 6.6c-.2-.9.2-1.9 1-2.4l2.7-1.5Z" /></svg>
              Call 03 9772 7411
            </Button>
          </div>
        </div>

        <div className="hp-brands-wrap">
          <div className="hp-brands hp-shell" aria-label="Vehicle brands serviced by CA Autobody">
            <div className="hp-brand-grid">
              {vehicleBrandLogos.map(([name, image]) => <div className="hp-brand-logo" key={name}><img src={image} alt={name} /><span>{name}</span></div>)}
            </div>
            <div className="hp-brand-rule"><span /><strong>All makes &amp; models</strong><span /></div>
          </div>
        </div>
      </section>

      <section className="hp-trust-section" aria-label="Why Melbourne drivers trust CA Autobody">
        <div className="hp-trust hp-shell">
          <article className="hp-trust__item hp-trust__item--google">
            <span className="hp-trust__brand hp-trust__brand--google" aria-hidden="true"><svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 0 1 12 24a12 12 0 0 1 19.2-9.6l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.3-.4-3.5Z" /><path fill="#FF3D00" d="M6.3 14.7 12.9 19A12 12 0 0 1 31.2 14.4l5.7-5.7A20 20 0 0 0 6.3 14.7Z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.3-5.2l-6.1-5.2A12 12 0 0 1 13 29l-6.5 5A20 20 0 0 0 24 44Z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.1 5.2C41 35.4 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5Z" /></svg></span>
            <div className="hp-trust__copy"><strong>4.9 star rating</strong><span className="hp-stars" aria-label="4.9 star rating">★★★★★</span><p>Based on Google reviews from our happy customers.</p></div>
          </article>
          <article className="hp-trust__item">
            <span className="hp-trust__brand hp-trust__brand--car" aria-hidden="true"><svg viewBox="0 0 64 48"><path d="M14 29 18.2 17.5A6 6 0 0 1 23.8 14h16.4a6 6 0 0 1 5.6 3.5L50 29" /><path d="M10 30h44a4 4 0 0 1 4 4v6H6v-6a4 4 0 0 1 4-4Z" /><circle cx="16" cy="38" r="3" /><circle cx="48" cy="38" r="3" /><path d="M20 24h24" /></svg></span>
            <div className="hp-trust__copy"><strong className="hp-trust__number">1000+</strong><b>Vehicles repaired</b><p>Thousands of Melbourne drivers trust us every year.</p></div>
          </article>
          <article className="hp-trust__item hp-trust__item--ev">
            <div className="hp-trust__copy"><strong>All makes &amp; models</strong><p>Specialist expertise in electric and luxury vehicles.</p><div className="hp-approved-marks" aria-label="Tesla and Zeekr repair expertise"><span><img src="/images/tesla_logo_PNG16.webp" alt="Tesla" /><b>Tesla</b></span><span><img src="/images/zeekr-1663156129.567872.webp" alt="Zeekr" /><b>Zeekr</b></span></div></div>
          </article>
          <article className="hp-trust__item">
            <span className="hp-trust__brand hp-trust__brand--location" aria-hidden="true"><svg viewBox="0 0 48 56"><path d="M24 52S8 37.7 8 22a16 16 0 1 1 32 0c0 15.7-16 30-16 30Z" /><circle cx="24" cy="22" r="5" /></svg></span>
            <div className="hp-trust__copy"><strong>Proudly local<br />Chelsea, VIC</strong><p>Conveniently located and proudly supporting our local community.</p></div>
          </article>
        </div>
      </section>

      <div className="hp-home-priority">
      <section className="hp-services hp-section hp-section--warm" id="services">
        <div className="hp-shell">
          <div className="hp-services__heading hp-reveal"><div><span className="hp-eyebrow">Our repair services</span><h2>Specialist care for the damage you can see — and the details you can’t.</h2></div><p>Choose a service to explore how CA Autobody can help. Each repair path is handled with the same focus on workmanship, communication and finish.</p></div>
          <ServiceExperience />
        </div>
      </section>

      <section className="hp-why hp-section hp-section--black dark-context-surface dark-context-surface--why" id="why-choose">
        <div className="hp-shell">
          <div className="hp-section-title hp-section-title--center hp-reveal"><div className="hp-title-rule"><span /><h2>Why choose CA Autobody?</h2><span /></div><p className="hp-values">Experience <i>/</i> Quality <i>/</i> Trust <i>/</i> Community</p><p className="hp-why__intro">With over 30 years of experience, VACC approval and a commitment to quality in every repair, we’re the smash repairer Melbourne drivers trust. From expert workmanship to clear customer care, we’re here to get you back on the road with confidence.</p></div>
        </div>
      </section>

      <section className="hp-accident-strip hp-shell hp-reveal" aria-label="Accident assistance">
        <div className="hp-accident-strip__lead"><span className="hp-round-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6.7 2.7 10 6l-2.1 2.1c1.1 2.3 2.9 4.1 5.2 5.2l2.1-2.1 3.3 3.3-1.7 2.5c-.5.8-1.5 1.2-2.4 1C8.6 17 4 12.4 3 6.6c-.2-.9.2-1.9 1-2.4l2.7-1.5Z" /></svg></span><div><strong>Need help after an accident?</strong><p>Call us now or request a free quote online — we’re here to help.</p></div></div>
        <div className="hp-accident-strip__actions"><Button href="tel:+61397727411" variant="gold" className="hp-btn--call">Call 03 9772 7411</Button><Button href="/contact" variant="outline" arrow>Get a Free Quote</Button></div>
      </section>

      <section className="hp-about hp-section">
        <div className="hp-shell hp-about__grid">
          <div className="hp-about__image hp-reveal"><img src={media.workshop.exterior} alt="CA Autobody workshop in Chelsea Heights" loading="lazy" /><span className="hp-image-label">Chelsea Heights · Melbourne</span></div>
          <div className="hp-about__copy hp-reveal"><span className="hp-eyebrow">Trusted car smash repair in Melbourne</span><h2>Repair work that feels considered from the first call to handover.</h2><p>CA Autobody supports drivers with collision repairs across a wide range of makes and models, combining modern repair methods with practical customer service from our Chelsea Heights facility.</p><p>Whether the vehicle needs panel work, refinishing, EV-aware repairs or help navigating an insurance claim, our team keeps the process clear and focused on getting you safely back on the road.</p><Link className="hp-arrow-link" href="/about">Discover CA Autobody <span>→</span></Link></div>
        </div>
      </section>


      <section className="hp-approved hp-section hp-section--black">
        <div className="hp-shell hp-approved__grid">
          <div className="hp-approved__copy hp-reveal"><span className="hp-eyebrow hp-eyebrow--light">Electric vehicle repair expertise</span><h2>Specialists in the vehicles of tomorrow.</h2><p>Modern electric vehicles demand repair decisions that respect their construction, safety systems and refinishing requirements. CA Autobody supports Tesla and Zeekr owners with dedicated repair expertise.</p><div className="hp-approved__brands"><span>TESLA</span><span>ZEEKR</span></div><Button href="/services/tesla-approved-repair-centre" variant="gold" arrow>Explore approved repairs</Button></div>
          <div className="hp-approved__media hp-reveal"><img src={media.service.tesla} alt="Tesla and electric vehicle repair" loading="lazy" /><div className="hp-approved__caption"><span>EV Repair</span><strong>Tesla + Zeekr</strong></div></div>
        </div>
      </section>

      <section className="hp-studio hp-section" id="workshop">
        <div className="hp-shell">
          <div className="hp-studio__head hp-reveal"><div><span className="hp-eyebrow">Inside CA Autobody</span><h2>A workshop built for precise, modern repairs.</h2></div><div className="hp-studio__intro"><p>See the facility, refinishing work and repair environment behind the finished result. Clean processes, experienced technicians and the equipment needed for today’s vehicles.</p><Link className="hp-arrow-link" href="/gallery">View the full gallery <span>→</span></Link></div></div>
          <div className="hp-studio__grid hp-reveal">
            <Link className="hp-studio-card hp-studio-card--feature" href="/gallery"><img src={media.workshop.floor} alt="CA Autobody workshop with repaired vehicles" loading="lazy" /><span className="hp-studio-card__shade" /><span className="hp-studio-card__meta"><small>01 · Workshop</small><strong>Built around quality repair work.</strong><b>Explore the facility →</b></span></Link>
            <Link className="hp-studio-card" href="/gallery"><img src={media.workshop.paintMixing} alt="CA Autobody paint technician preparing a vehicle finish" loading="lazy" /><span className="hp-studio-card__shade" /><span className="hp-studio-card__meta"><small>02 · Refinishing</small><strong>Precision colour and finish.</strong></span></Link>
            <Link className="hp-studio-card" href="/gallery"><img src={media.workshop.exteriorWide} alt="CA Autobody Chelsea Heights facility" loading="lazy" /><span className="hp-studio-card__shade" /><span className="hp-studio-card__meta"><small>03 · Chelsea Heights</small><strong>Your local repair facility.</strong></span></Link>
          </div>
        </div>
      </section>

      <section className="hp-insurance hp-section hp-section--warm" id="insurance">
        <div className="hp-shell"><div className="hp-insurance__head hp-reveal"><span className="hp-eyebrow">Insurance support</span><h2>We work with leading insurers.</h2><p>Need help understanding the next step in your claim? Our team can help you navigate the repair process.</p><Link className="hp-arrow-link" href="/contact">Need help with your claim? <span>→</span></Link></div><div className="hp-reveal" aria-label="Insurance partners and providers CA Autobody works with"><InsurerLogoGrid insurers={insurers} className="hp-insurer-grid" /></div></div>
      </section>

      <section className="hp-location hp-section" id="location">
        <div className="hp-shell hp-location__grid">
          <div className="hp-location__copy hp-reveal"><span className="hp-eyebrow">Chelsea Heights · Melbourne</span><h2>Local expertise. Melbourne-wide service.</h2><p>Visit our Chelsea Heights facility or speak with the team before you arrive. We’ll help you understand the repair process and what to bring.</p><dl><div><dt>Address</dt><dd>7 Ashley Park Drive, Chelsea Heights, VIC 3196</dd></div><div><dt>Phone</dt><dd><a href="tel:+61397727411">03 9772 7411</a></dd></div><div><dt>Hours</dt><dd>Monday–Friday · contact us for current workshop hours</dd></div></dl><div className="hp-location__actions"><Button href="tel:+61397727411" variant="black">Call the team</Button><Button href="https://www.google.com/maps/search/?api=1&query=7+Ashley+Park+Drive+Chelsea+Heights+VIC+3196" variant="outline" arrow target="_blank" rel="noopener">Get directions</Button></div></div>
          <div className="hp-location__map hp-reveal"><iframe title="Map showing CA Autobody in Chelsea Heights" loading="lazy" src="https://www.google.com/maps?q=7%20Ashley%20Park%20Drive%20Chelsea%20Heights%20VIC%203196&output=embed" /></div>
        </div>
      </section>
      </div>

    </main>
  );
}

import Link from "next/link";
import { media } from "@/lib/media";

const areas = ["Aspendale", "Braeside", "Carrum", "Chelsea", "Cheltenham", "Edithvale", "Mentone", "Mordialloc", "Parkdale", "Sandhurst"];

export default function SiteFooter() {
  return (
    <footer className="hp-footer">
      <div className="hp-shell hp-footer__grid">
        <div className="hp-footer__brand">
          <img src={media.logo} alt="CA Chelsea Autobody" />
          <p>Trusted smash repairs, body work and refinishing from Chelsea Heights, Melbourne.</p>
          <a className="hp-footer__phone" href="tel:+61397727411">03 9772 7411</a>
        </div>

        <nav className="hp-footer__nav" aria-label="Footer information">
          <h3>Info</h3>
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/services">Services</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/areas-we-serve">Areas We Serve</Link>
          <Link href="/blog">Blogs</Link>
          <Link href="/frequently-asked-questions">FAQs</Link>
        </nav>

        <nav className="hp-footer__nav" aria-label="Footer services">
          <h3>Services</h3>
          <Link href="/services/accident-assistance">Accident Assistance</Link>
          <Link href="/services/paintless-dent-removal">Paintless Dent Removal</Link>
          <Link href="/services/panel-beating">Panel Beating</Link>
          <Link href="/services/replacement-vehicles">Replacement Vehicles</Link>
          <Link href="/services/spray-painting">Spray Painting</Link>
        </nav>

        <nav className="hp-footer__areas" aria-label="Areas CA Autobody serves">
          <h3>Areas We Serve</h3>
          {areas.map((area) => <Link key={area} href={`/areas-we-serve/${area.toLowerCase()}`}>{area}</Link>)}
        </nav>

        <div className="hp-footer__contact">
          <h3>Visit &amp; contact</h3>
          <a className="hp-footer__address" href="https://maps.app.goo.gl/uUBDdnUREwuRvdBG8" target="_blank" rel="noopener noreferrer">7 Ashley Park Drive<br />Chelsea Heights, VIC 3196</a>
          <a href="tel:+61397727411">03 9772 7411</a>
          <a className="hp-footer__email" href="mailto:info@caautobody.com.au">info@caautobody.com.au</a>
          <p className="hp-footer__hours-label">Opening hours</p>
          <p className="hp-footer__hours">Monday – Friday · 8am – 5pm<br />Saturday · Closed<br />Sunday · Closed</p>
          <div className="hp-footer__socials" aria-label="Social media">
            <a href="https://www.facebook.com/CA-Chelsea-AutoBody-105411534900916/" target="_blank" rel="noopener noreferrer" aria-label="CA Autobody on Facebook">f</a>
            <a href="https://www.instagram.com/chelseaautobody/" target="_blank" rel="noopener noreferrer" aria-label="CA Autobody on Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.4" cy="6.8" r="1.1" fill="currentColor" /></svg>
            </a>
          </div>
        </div>
      </div>
      <div className="hp-shell hp-footer__bottom">
        <span>© 2026 CA Chelsea Autobody. All rights reserved.</span>
        <nav className="hp-footer__legal" aria-label="Legal and site information">
          <Link href="/sitemap">Sitemap</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
        </nav>
      </div>
    </footer>
  );
}

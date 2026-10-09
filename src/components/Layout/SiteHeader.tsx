"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const chevron = (
  <svg className="hp-chevron" viewBox="0 0 12 8" aria-hidden="true" focusable="false"><path d="M1 1.5 6 6.5 11 1.5" /></svg>
);

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const sync = () => setScrollY(window.scrollY || 0);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenGroup(null);
    document.body.classList.remove("hp-menu-open");
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("hp-menu-open", menuOpen);
    return () => document.body.classList.remove("hp-menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenGroup(null);
        setMenuOpen(false);
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".hp-nav__group")) setOpenGroup(null);
    };
    const onResize = () => {
      if (window.innerWidth > 1020) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const groupProps = (name: string) => ({
    className: `hp-nav__group ${openGroup === name ? "is-open" : ""}`,
  });

  const toggleGroup = (name: string) => setOpenGroup((value) => value === name ? null : name);
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className={`hp-header ${scrollY > 18 ? "is-scrolled" : ""} ${scrollY > 88 ? "is-compact" : ""}`}>
      <div className="hp-header__inner">
        <Link className="hp-logo" href="/" aria-label="CA Chelsea Autobody home">
          <img src="https://caautobody.com.au/wp-content/uploads/2021/05/logo.png" alt="CA Chelsea Autobody" />
        </Link>

        <button
          className="hp-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="hp-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span /><span /><span />
        </button>

        <nav className={`hp-nav ${menuOpen ? "is-open" : ""}`} id="hp-navigation" aria-label="Primary navigation" onClick={(event) => {
          if ((event.target as Element).closest("a")) setMenuOpen(false);
        }}>
          <Link className={`hp-nav__link ${active("/") ? "is-active" : ""}`} href="/">Home</Link>

          <div {...groupProps("about")}>
            <button className="hp-nav__link hp-nav__trigger" type="button" aria-expanded={openGroup === "about"} onClick={() => toggleGroup("about")}>About Us {chevron}</button>
            <div className="hp-mega hp-mega--about">
              <div className="hp-mega__tray">
                <div className="hp-mega__intro">
                <span className="hp-kicker">CA Autobody</span>
                <h2>Repair experience built on trust.</h2>
                <p>Get to know the team, our repair approach and why Melbourne drivers continue to choose CA Autobody.</p>
                <Link href="/about">About CA Autobody <span>→</span></Link>
              </div>
              <div className="hp-mega__links">
                <Link href="/about#why"><strong>Why Choose CA</strong><span>Experience, quality and customer care.</span></Link>
                <Link href="/about#insurance"><strong>Insurance</strong><span>Support through the repair and claim process.</span></Link>
                <Link href="/gallery"><strong>Gallery</strong><span>See our workshop, repairs and facility.</span></Link>
                </div>
              </div>
            </div>
          </div>

          <div {...groupProps("services")}>
            <button className="hp-nav__link hp-nav__trigger" type="button" aria-expanded={openGroup === "services"} onClick={() => toggleGroup("services")}>Services {chevron}</button>
            <div className="hp-mega hp-mega--services">
              <div className="hp-mega__tray">
                <div className="hp-mega__intro hp-mega__intro--service">
                <span className="hp-kicker">Repair Services</span>
                <h2>From accident damage to precision refinishing.</h2>
                <p>One experienced repair team for body, paint, EV and accident support.</p>
                <Link href="/services">View all services <span>→</span></Link>
              </div>
              <div className="hp-mega__service-grid">
                <Link href="/services/tesla-approved-repair-centre"><span>01</span><strong>Tesla Repair</strong><small>Approved EV repair expertise</small></Link>
                <Link href="/services/services-zeekr-approved-repairer-melbourne"><span>02</span><strong>Zeekr Repair</strong><small>Modern EV body repair</small></Link>
                <Link href="/services/accident-assistance"><span>03</span><strong>Accident Assistance</strong><small>Support after a collision</small></Link>
                <Link href="/services/panel-beating"><span>04</span><strong>Panel Beating</strong><small>Structural and cosmetic repair</small></Link>
                <Link href="/services/spray-painting"><span>05</span><strong>Spray Painting</strong><small>Precise colour matching</small></Link>
                <Link href="/services/paintless-dent-removal"><span>06</span><strong>Paintless Dent Removal</strong><small>Low-impact dent repair</small></Link>
                <Link href="/services/replacement-vehicles"><span>07</span><strong>Replacement Vehicles</strong><small>Keep moving while we repair</small></Link>
                </div>
              </div>
            </div>
          </div>

          <Link className={`hp-nav__link ${active("/blog") ? "is-active" : ""}`} href="/blog">Blog</Link>

          <div {...groupProps("brands")}>
            <button className="hp-nav__link hp-nav__trigger" type="button" aria-expanded={openGroup === "brands"} onClick={() => toggleGroup("brands")}>Brands {chevron}</button>
            <div className="hp-mega hp-mega--brands">
              <div className="hp-mega__tray">
                <div className="hp-brand-features">
                  <Link className="hp-brand-feature" href="/services/tesla-approved-repair-centre">
                <span className="hp-kicker">Approved Expertise</span><strong>Tesla</strong><small>Specialist collision repair for Tesla vehicles.</small><b>Explore Tesla repair →</b>
              </Link>
              <Link className="hp-brand-feature" href="/services/services-zeekr-approved-repairer-melbourne">
                <span className="hp-kicker">Approved Repairer</span><strong>Zeekr</strong><small>Repair support for modern electric vehicle construction.</small><b>Explore Zeekr repair →</b>
              </Link>
              <Link className="hp-brand-feature" href="/services/byd-approved-repairer-melbourne">
                <span className="hp-kicker">Approved Repairer</span><strong>BYD</strong><small>Approved collision repair support for BYD vehicles.</small><b>Explore BYD repair →</b>
              </Link>
              <Link className="hp-brand-feature" href="/services/lexus-approved-body-shop-melbourne">
                <span className="hp-kicker">Approved Repairer</span><strong>Lexus</strong><small>Approved collision repair support for Lexus vehicles.</small><b>Explore Lexus repair →</b>
              </Link>
                </div>
                <div className="hp-brand-list"><span>All makes &amp; models</span><p>Porsche · BMW · Volkswagen · Audi · Mercedes-Benz · Subaru · Honda · Ford · Mazda · Hyundai · Kia and more.</p></div>
              </div>
            </div>
          </div>

          <Link className={`hp-nav__link ${active("/frequently-asked-questions") ? "is-active" : ""}`} href="/frequently-asked-questions">FAQs</Link>
          <Link className={`hp-nav__link ${active("/contact") ? "is-active" : ""}`} href="/contact">Contact Us</Link>
          <div className="hp-nav__mobile-utility" aria-label="More links">
            <a href="tel:+61397727411">Call 03 9772 7411</a>
            <Link href="/sitemap">Sitemap</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-and-conditions">Terms</Link>
          </div>
        </nav>

        <a className="hp-header__call" href="tel:+61397727411" aria-label="Call CA Autobody on 03 9772 7411">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 2.7 10 6l-2.1 2.1c1.1 2.3 2.9 4.1 5.2 5.2l2.1-2.1 3.3 3.3-1.7 2.5c-.5.8-1.5 1.2-2.4 1C8.6 17 4 12.4 3 6.6c-.2-.9.2-1.9 1-2.4l2.7-1.5Z" /></svg>
          <span>Call 03 9772 7411</span>
        </a>
      </div>
    </header>
  );
}

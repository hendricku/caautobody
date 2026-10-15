"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { media } from "@/lib/media";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PhoneRounded from "@mui/icons-material/PhoneRounded";
import ActionIcon from "@/components/UI/ActionIcon";

const chevron = (
  <ExpandMoreRounded className="hp-chevron" aria-hidden="true" focusable="false" />
);

type SiteSettings = {
  name: string;
  phone: string;
  phoneHref: string;
  email: string;
  address: string;
};

export default function SiteHeader({ siteSettings }: { siteSettings: SiteSettings }) {
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
        <Link className="hp-logo" href="/" aria-label={`${siteSettings.name} home`}>
          <img src={media.logo} alt={siteSettings.name} />
        </Link>

        <button
          className="hp-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="hp-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <CloseRounded aria-hidden="true" /> : <MenuRounded aria-hidden="true" />}
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
                <Link href="/about">About CA Autobody <ActionIcon /></Link>
              </div>
              <Link className="hp-mobile-submenu-start" href="/about"><span>About CA Autobody</span><ActionIcon /></Link>
              <div className="hp-mega__links">
                <Link href="/about#why"><strong>Why Choose CA</strong><span>Experience, quality and customer care.</span></Link>
                <Link href="/about#insurance"><strong>Insurance</strong><span>Support through the repair and claim process.</span></Link>
                <Link href="/gallery"><strong>Gallery</strong><span>See our workshop, repairs and facility.</span></Link>
                <Link href="/areas-we-serve"><strong>Areas We Serve</strong><span>Local repair support across Melbourne’s bayside and nearby suburbs.</span></Link>
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
                <Link href="/services">View all services <ActionIcon /></Link>
              </div>
              <Link className="hp-mobile-submenu-start" href="/services"><span>View all services</span><ActionIcon /></Link>
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
            <div className="hp-mobile-brand-links" aria-label="Brand repair services">
              <Link href="/services/tesla-approved-repair-centre">Tesla Repair</Link>
              <Link href="/services/services-zeekr-approved-repairer-melbourne">Zeekr Repair</Link>
              <Link href="/services/byd-approved-repairer-melbourne">BYD Repair</Link>
              <Link href="/services/lexus-approved-body-shop-melbourne">Lexus Repair</Link>
            </div>
            <div className="hp-mega hp-mega--brands">
              <div className="hp-mega__tray">
                <div className="hp-brand-features">
                  <Link className="hp-brand-feature" href="/services/tesla-approved-repair-centre">
                <span className="hp-kicker">Approved Expertise</span><strong>Tesla</strong><small>Specialist collision repair for Tesla vehicles.</small><b>Explore Tesla repair <ActionIcon /></b>
              </Link>
              <Link className="hp-brand-feature" href="/services/services-zeekr-approved-repairer-melbourne">
                <span className="hp-kicker">Approved Repairer</span><strong>Zeekr</strong><small>Repair support for modern electric vehicle construction.</small><b>Explore Zeekr repair <ActionIcon /></b>
              </Link>
              <Link className="hp-brand-feature" href="/services/byd-approved-repairer-melbourne">
                <span className="hp-kicker">Approved Repairer</span><strong>BYD</strong><small>Approved collision repair support for BYD vehicles.</small><b>Explore BYD repair <ActionIcon /></b>
              </Link>
              <Link className="hp-brand-feature" href="/services/lexus-approved-body-shop-melbourne">
                <span className="hp-kicker">Approved Repairer</span><strong>Lexus</strong><small>Approved collision repair support for Lexus vehicles.</small><b>Explore Lexus repair <ActionIcon /></b>
              </Link>
                </div>
                <div className="hp-brand-list"><span>All makes &amp; models <i aria-hidden="true">·</i> Prestige brands</span><p>Porsche · BMW · Volkswagen · Audi · Mercedes-Benz · Subaru · Honda · Ford · Mazda · Hyundai · Kia and more.</p></div>
              </div>
            </div>
          </div>

          <Link className={`hp-nav__link ${active("/frequently-asked-questions") ? "is-active" : ""}`} href="/frequently-asked-questions">FAQs</Link>
          <Link className={`hp-nav__link ${active("/contact") ? "is-active" : ""}`} href="/contact">Contact Us</Link>
          <div className="hp-nav__mobile-utility" aria-label="More links">
            <a href={`tel:${siteSettings.phoneHref}`}>Call {siteSettings.phone}</a>
            <Link href="/sitemap">Sitemap</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-and-conditions">Terms</Link>
          </div>
        </nav>

        <a className="hp-header__call" href={`tel:${siteSettings.phoneHref}`} aria-label={`Call ${siteSettings.name} on ${siteSettings.phone}`}>
          <PhoneRounded aria-hidden="true" />
          <span>Call {siteSettings.phone}</span>
        </a>
      </div>
    </header>
  );
}

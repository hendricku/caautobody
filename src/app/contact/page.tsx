import type { Metadata } from "next";
import PageHero from "@/components/Common/PageHero";
import ContactForm from "@/components/Public/ContactForm";
import { getPublishedLocations } from "@/lib/cms/public-content";
import { site } from "@/lib/siteContent";
import { media } from "@/lib/media";

export const metadata: Metadata = {
  title: "Book a Service Chelsea Heights | CA Autobody",
  description: "Contact CA Autobody at 7 Ashley Park Drive, Chelsea Heights, VIC 3196 or call 03 9772 7411.",
};

export default async function ContactPage() {
  const locations = await getPublishedLocations();
  const suburbs = [...new Set(locations.map(({ name }) => name.trim()).filter(Boolean))];

  return <main className="contact-page">
    <PageHero eyebrow="Contact" title="Contact CA Autobody for Expert Auto Repair Services" image={media.hero.contact} intro="Ready to book a service Chelsea Heights locals rely on?" />
    <section className="contact-booking shell section-pad">
      <div className="contact-booking__intro hp-reveal"><h2>Get in touch.</h2><p>Contact us today and our dedicated CA Autobody team will take it from there. Whether it&apos;s minor touch-ups or major restoration work, we&apos;ll get your vehicle sorted quickly and properly.</p></div>
      <div className="contact-booking__layout hp-reveal">
        <div className="contact-booking__form contact-booking__form--docket"><p className="contact-booking__label">Get in touch</p><h2>Tell us about your vehicle.</h2><ContactForm suburbs={suburbs} /></div>
        <aside className="contact-booking__details" aria-labelledby="contact-details-title">
          <p className="contact-booking__label">Visit &amp; contact</p><h2 id="contact-details-title">CA Autobody</h2>
          <dl>
            <div><dt>Location</dt><dd>{site.address}</dd></div>
            <div><dt>Phone</dt><dd><a href={`tel:${site.phoneHref}`}>{site.phone}</a></dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${site.email}`}>{site.email}</a></dd></div>
            <div><dt>Opening hours</dt><dd>Monday - Friday - 8am- 5:00pm<br />Saturday - Closed<br />Sunday - Closed</dd></div>
          </dl>
          <a className="contact-booking__directions" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=7+Ashley+Park+Drive+Chelsea+Heights+VIC+3196">Get directions <span aria-hidden="true">→</span></a>
        </aside>
      </div>
    </section>
    <section className="contact-booking__map shell hp-reveal" aria-label="CA Autobody location map"><iframe loading="lazy" src="https://www.google.com/maps?q=7%20Ashley%20Park%20Drive%20Chelsea%20Heights%20VIC%203196&output=embed" title="CA Autobody location" /></section>
  </main>;
}

import Button from "@/components/UI/Button";
import type { Metadata } from "next";
import PageHero from "@/components/Common/PageHero";
import InsurerLogoGrid from "@/components/Public/InsurerLogoGrid";
import FeatureGrid from "@/components/Public/FeatureGrid";
import { insurers } from "@/lib/siteContent";
import { media } from "@/lib/media";

export const metadata: Metadata = {
  title: "About CA Autobody | Quality Vehicle Repairs in Chelsea Heights",
  description: "Learn why Melbourne drivers choose CA Autobody for VACC-approved repairs, insurer support, replacement vehicles and local pickup and drop-off.",
};

const reasons = [
  ["Replacement car available", "Keep moving while your vehicle is in our workshop. Ask our team about replacement-car availability for your repair."],
  ["30+ years of experience", "Our long-standing repair experience means your vehicle is assessed and repaired with practical knowledge and care."],
  ["VACC approved", "Our workshop follows VACC industry standards, with quality and professionalism at the centre of every repair."],
  ["Lifetime warranty on repairs", "We stand behind our workmanship with a lifetime warranty on repairs, giving you confidence in the work completed."],
  ["Local pickup and drop-off", "We offer pickup and drop-off support in local areas, so arranging a repair is easier to fit around your day."],
];

const choosingPoints = [
  ["A proven local reputation", "Reviews and recommendations can help you find a repairer known for quality work and satisfied customers."],
  ["Experience and accreditation", "A repairer with experienced, properly trained technicians is better placed to assess a wide range of repair situations and work to current standards."],
  ["The right equipment", "Modern tools and repair technology help deliver precise, efficient work and get you back on the road sooner."],
];

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="Chelsea Heights, Victoria"
        title="Your premier destination for quality vehicle repairs"
        image={media.hero.about}
        intro="Tesla and Zeekr-approved repairs, experienced workmanship and thoughtful support when you need it most."
      />

      <section className="about-intro shell section-pad hp-reveal" aria-labelledby="about-intro-title">
        <div className="about-intro__heading">
          <span className="eyebrow">About CA Autobody</span>
          <h2 id="about-intro-title">Quality repairs, with the customer experience in mind.</h2>
        </div>
        <div className="about-intro__copy copy-stack">
          <p>If you are looking for reliable auto body repairs in Chelsea Heights, CA Autobody can help. We are an official Tesla-approved and Zeekr-approved repairer, conveniently located on the Peninsula with free pickup and delivery support available.</p>
          <p>The CA Chelsea Autobody team takes pride in quality repairs and outstanding customer service. We understand that crash repairs often follow an unfortunate accident, so we work to make the process as clear and manageable as possible.</p>
          <p>We handle fleet, insurance-approved and private repairs. Every job is approached with safety, quality and VACC industry standards in mind.</p>
          <p>From help with your insurance claim to regular progress updates and a comfortable waiting area, our friendly team is here to make your repair experience easier.</p>
          <Button href="/contact" variant="black" arrow>Speak with our team</Button>
        </div>
      </section>

      <section className="about-workshop hp-reveal" aria-label="CA Autobody workshop">
        <img src={media.workshop.floor} alt="CA Chelsea Autobody workshop in Chelsea Heights" />
      </section>

      <section className="about-assurances" aria-label="CA Autobody service assurances">
        <div className="shell about-assurances__grid">
          <p>Pickup and drop-off valet service</p>
          <p>VACC-approved crash repairs</p>
          <p>Additional car-wash service</p>
        </div>
      </section>

      <section id="why" className="about-why section-pad">
        <div className="shell">
          <div className="about-why__lead hp-reveal">
            <div>
              <span className="eyebrow light">Why choose CA</span>
              <h2>Less disruption. More confidence in your repair.</h2>
            </div>
            <div>
              <p>Vehicle repairs can be stressful and inconvenient. As an official Tesla-approved and Zeekr-approved repairer, CA Autobody combines trusted workmanship with practical support that helps make the next step easier.</p>
              <p>That is why Melbourne drivers, including EV owners, turn to our Chelsea Heights workshop.</p>
            </div>
          </div>
          <FeatureGrid tone="warm" items={reasons.map(([title, copy]) => ({ title, content: <p>{copy}</p> }))} />
        </div>
      </section>

      <section className="about-tips shell section-pad hp-reveal" aria-labelledby="tips-title">
        <div className="about-tips__heading">
          <span className="eyebrow">Choosing a repairer</span>
          <h2 id="tips-title">What to look for in a reliable auto body repairer.</h2>
        </div>
        <div className="about-tips__body">
          <p className="about-tips__lead">When choosing a repairer, look for a business with a strong record of quality service, skilled technicians and equipment suited to modern vehicles. These details make a real difference to the repair experience and the result.</p>
          <div className="about-tips__points">
            <FeatureGrid items={choosingPoints.map(([title, copy]) => ({ title, content: <p>{copy}</p> }))} />
          </div>
          <p className="about-tips__closing">At CA Autobody, experienced technicians, factory-aligned repair procedures and a focus on customer care work together to give you confidence from assessment through to collection.</p>
        </div>
      </section>

      <section id="insurance" className="about-insurance section-pad" aria-labelledby="insurance-title">
        <div className="shell about-insurance__grid hp-reveal">
          <div className="about-insurance__copy">
            <h2 id="insurance-title">Insurance</h2>
            <p>CA Chelsea Autobody is recognised by many insurance companies and continues to grow our network within the industry.</p>
            <p>Whether you are at fault or not at fault, we can assist you through the insurance process.</p>
            <p>Our friendly staff can help lodge your claim and follow up with the relevant insurer to help get authorised repairs underway.</p>
            <p>We ensure authorised repair quotes are based on genuine manufacturer parts and repair procedures where applicable.</p>
            <p>Our work is backed by a lifetime repair warranty and completed with a focus on quality workmanship, best-practice repair methods and factory specifications.</p>
          </div>
          <div className="about-insurance__partners" aria-label="Insurance partners">
            <p className="about-insurance__label">Insurance partners</p>
            <InsurerLogoGrid insurers={insurers} />
          </div>
        </div>
      </section>
    </main>
  );
}

import AdsLandingPage from "@/components/Public/AdsLandingPage";
import { media } from "@/lib/media";
import type { OfferContent } from "@/types/content";

export default function OfferPage({ offer }: { offer: OfferContent }) {
  const items = offer.bullets.map((title) => ({ title, copy: "Discuss this with the workshop during your assessment." }));
  return <AdsLandingPage page={{
    slug: offer.slug, kind: "standard", seoTitle: offer.seoTitle, seoDescription: offer.intro,
    eyebrow: offer.eyebrow || "CA AUTOBODY REPAIR SUPPORT", title: offer.title, intro: offer.intro,
    heroImage: offer.image || media.workshop.exteriorWide, heroAlt: offer.title, primaryCta: "Start my repair assessment", models: ["Other"],
    formTitle: "Tell us what happened", formIntro: "Share a few details and the CA Autobody team will contact you shortly.", formNote: "No obligation. Repair scope and next steps are confirmed after assessment.",
    heroProof: offer.bullets.slice(0, 4), proof: items.slice(0, 4),
    overview: { eyebrow: "REPAIR SUPPORT", title: "Clear support from first contact to handover", copy: offer.body.join(" "), image: { src: offer.image || media.workshop.exteriorWide, alt: offer.title }, points: items.slice(0, 4) },
    principles: { eyebrow: "HOW WE WORK", title: "A considered repair path", items },
    capability: { eyebrow: "WHAT TO EXPECT", title: "Repair support that stays clear", intro: "Your assessment helps the team explain the next practical steps.", items },
    journey: { eyebrow: "NEXT STEPS", title: "A clear repair journey", intro: "From first contact to the completed repair.", items },
    support: { eyebrow: "SUPPORT", title: "Speak with the workshop", copy: "We are here to help you understand the repair pathway.", items: offer.bullets },
    faq: [], review: { quote: "CA Autobody provides clear communication and considered repair support.", author: "CA Autobody" },
    final: { eyebrow: "READY TO START?", title: "Send your repair details", copy: "Submit the assessment form or call the workshop." }, disclaimer: "Repair scope, availability and next steps are confirmed after assessment.", customSections: offer.sections,
  }} />;
}

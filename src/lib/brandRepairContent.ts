import { media } from "@/lib/media";

export type BrandRepairContent = {
  brand: "BYD" | "Lexus";
  seoDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  logo: string;
  assessmentCta: string;
  contactCta: string;
  serviceGuide: string[];
  approvalPoints: string[];
  approvalTitle: string;
  approvalCopy: string;
  pillars: Array<{ code: string; title: string; copy: string }>;
  principles: Array<{ title: string; copy: string }>;
  capabilities: Array<{ title: string; copy: string }>;
  systemsTitle: string;
  systemsCopy: string;
  process: Array<{ title: string; copy: string }>;
  supportTitle: string;
  supportCopy: string;
  supportPoints: string[];
  disclaimer: string;
  faqs: Array<{ question: string; answer: string }>;
  review: { rating: string; quote: string; author: string };
  media: Array<{ image: string; alt: string; label?: string }>;
  sections: {
    assessmentEyebrow: string;
    assessmentTitle: string;
    assessmentNote: string;
    approvalEyebrow: string;
    principlesEyebrow: string;
    principlesTitle: string;
    capabilityEyebrow: string;
    capabilityTitle: string;
    capabilityIntro: string;
    systemsEyebrow: string;
    journeyEyebrow: string;
    journeyTitle: string;
    journeyIntro: string;
    supportEyebrow: string;
    faqEyebrow: string;
    faqTitle: string;
    reviewEyebrow: string;
    reviewTitle: string;
    finalEyebrow: string;
    finalTitle: string;
    finalCopy: string;
  };
};

const sharedSections = {
  assessmentEyebrow: "Tell us what happened",
  assessmentTitle: "A short assessment helps us triage safety, claim and repair requirements.",
  assessmentNote: "No obligation. Final repair scope, parts, claim approvals, towing and vehicle availability are confirmed after assessment.",
  approvalEyebrow: "Why manufacturer approval matters",
  principlesEyebrow: "A complete repair, not a cosmetic shortcut",
  principlesTitle: "Protect what the vehicle was engineered to do",
  capabilityEyebrow: "Repair capability",
  capabilityTitle: "Everything required for a considered collision repair",
  capabilityIntro: "From first assessment to final quality checks, every stage is coordinated by one experienced repair team.",
  systemsEyebrow: "Systems and quality control",
  journeyEyebrow: "What happens next",
  journeyTitle: "A clear five step repair journey",
  journeyIntro: "Know what to expect from the first call through to final quality checks and vehicle handover.",
  faqEyebrow: "Questions answered",
  faqTitle: "Answers before you book your repair",
  reviewEyebrow: "What our customers say",
  reviewTitle: "Rated 4.9 by Melbourne motorists",
  finalEyebrow: "Ready to start?",
  finalTitle: "Send the damage details before you authorise repairs",
  finalCopy: "Upload the vehicle and claim information or call the team for immediate accident assistance.",
} as const;

export const brandRepairContent: Record<string, BrandRepairContent> = {
  "byd-approved-repairer-melbourne": {
    brand: "BYD",
    seoDescription: "CA Autobody is an approved BYD repairer in Chelsea Heights, Melbourne. Genuine OEM parts, EV battery-safe repairs and insurance claim help. Call us today.",
    eyebrow: "APPROVED BYD COLLISION REPAIRS IN MELBOURNE",
    title: "BYD Approved Repairer Melbourne",
    intro: "BYD vehicles combine high voltage battery systems, advanced driver assistance technology and model-specific body structures. CA Autobody delivers approved BYD repairs using genuine OEM BYD parts and manufacturer-approved procedures.",
    heroImage: media.brandRepair.bydHero,
    heroAlt: "Close-up of electric car charging",
    logo: "/images/BYD.webp",
    assessmentCta: "Enquire about a repair",
    contactCta: "Contact CA Autobody",
    serviceGuide: ["BYD repair standards", "Wide range of services", "Why choose CA Autobody?"],
    approvalPoints: ["Approved BYD Repairer", "EV battery safe repair procedures", "Genuine OEM BYD parts within the approved plan", "Claim assistance, towing and loan vehicle options"],
    approvalTitle: "BYD approved repairer: our capabilities",
    approvalCopy: "BYD's electric vehicles bring advanced battery and safety technology, and repairs need to match. As an approved BYD repairer in Chelsea Heights, CA Autobody follows manufacturer-approved procedures and uses genuine OEM parts, so your BYD is repaired properly, not just cosmetically.",
    pillars: [
      { code: "BAT", title: "Battery safe work", copy: "Controlled isolation and inspection steps are planned around the vehicle and repair area." },
      { code: "BODY", title: "Body structure", copy: "Model specific measurements, joining methods and repair limits guide structural work." },
      { code: "ADAS", title: "Safety technology", copy: "Affected cameras, radar and driver assistance systems are identified and calibration needs are addressed." },
      { code: "OEM", title: "Genuine parts", copy: "Genuine OEM BYD parts support fit, system compatibility and the manufacturer approved repair method." },
    ],
    principles: [
      { title: "Structural and body repairs", copy: "Model-specific measuring, joining and panel work to the approved scope." },
      { title: "Paint and refinishing", copy: "Precise colour matching for a seamless finish." },
      { title: "Diagnostics and ADAS calibration", copy: "System scans and calibration checks before the vehicle goes home." },
      { title: "Genuine parts", copy: "Genuine OEM BYD parts within the approved repair scope." },
    ],
    capabilities: [
      { title: "Approved BYD repairs", copy: "Every repair follows manufacturer-approved procedures, from the first assessment through to final checks." },
      { title: "EV battery-safe procedures", copy: "Even damage that looks cosmetic can affect the high voltage system. We plan isolation and battery protection around your vehicle and the repair area." },
      { title: "Advanced diagnostics and calibration", copy: "We scan for system faults and check affected cameras, radar and driver assistance systems. Any calibration needed is addressed before handover." },
      { title: "Insurance coordination", copy: "We prepare the estimate and repair information for your insurer and help with claim communication, so the process stays simple." },
      { title: "Genuine OEM BYD parts", copy: "We use genuine OEM BYD parts within the approved repair plan, supporting fit, system compatibility and safety." },
      { title: "Clear, caring customer experience", copy: "You get a clear estimate, direct progress updates and final quality checks. Towing and loan vehicle options are available, subject to availability and eligibility." },
    ],
    systemsTitle: "Repair quality you can see and systems work you can trust",
    systemsCopy: "Controlled refinishing is paired with structural, safety and diagnostic checks so the vehicle is not treated as a cosmetic repair alone.",
    process: [
      { title: "Start the assessment", copy: "Call or upload your details and photos. We confirm whether the vehicle should be driven or towed." },
      { title: "Inspect and plan", copy: "The vehicle is assessed for visible, structural, battery and system related damage." },
      { title: "Confirm approval", copy: "We prepare the estimate, parts and repair pathway and assist with insurer communication." },
      { title: "Complete approved repairs", copy: "Technicians follow the applicable BYD repair methods and quality controls." },
      { title: "Final checks and return", copy: "Fit, finish, diagnostics and any calibration requirements are checked before handover." },
    ],
    supportTitle: "Why Choose CA Autobody?",
    supportCopy: "BYD owners need a repairer who treats the vehicle as more than a cosmetic job. CA Autobody combines approved repair methods, genuine OEM parts and clear communication, so you know what’s happening at every step. Whether it’s a minor repair or major structural work, we’re your local approved BYD repairer in Chelsea Heights.",
    supportPoints: [],
    disclaimer: "Manufacturer warranty, insurance coverage, parts approval, towing and loan vehicle availability depend on the repair and your individual circumstances. We’ll explain what applies to your vehicle before any work starts.",
    faqs: [
      { question: "Is CA Autobody an Approved BYD Repairer?", answer: "Yes. CA Autobody is an Approved BYD Repairer in Melbourne. Current BYD approved repairer, confirmed for your model." },
      { question: "Will repairs follow BYD procedures?", answer: "Yes. The repair is planned around manufacturer approved procedures, genuine parts and model specific requirements. The final scope depends on the assessed damage." },
      { question: "Can you help if I have not lodged a claim?", answer: "Yes. Send the vehicle and accident details first so the team can explain the practical repair and claim information you may need." },
      { question: "Is a loan car guaranteed?", answer: "No. Loan or replacement vehicle availability and eligibility must be confirmed for the individual repair or claim." },
      { question: "What warranty applies?", answer: "CA Autobody offers a lifetime workmanship warranty subject to its written warranty terms and exclusions." },
    ],
    review: { rating: "4.9 · 300+ five star reviews from 352 Google reviews", quote: "I do not normally leave a review but in this case it is easy. The service we received from the initial contact up until the completion of our car repair was outstanding. Communication was excellent throughout the process, and the workmanship and quality of the repair is excellent. Could not be happier with the outcome.", author: "Rodney K. Google review" },
    media: [
      { image: media.brandRepair.bydHero, alt: "Close-up of electric car charging", label: "EV repair context" },
      { image: media.brandRepair.bydPanel, alt: "Car mechanic working to remove dent in workshop", label: "Panel repair" },
      { image: media.brandRepair.diagnostics, alt: "Automotive mechanic inspecting a vehicle with diagnostic software", label: "Diagnostic checks" },
    ],
    sections: { ...sharedSections, principlesEyebrow: "Wide range of services", principlesTitle: "Complete collision repair for BYD owners.", capabilityEyebrow: "BYD approved repairer", capabilityTitle: "Our capabilities", capabilityIntro: "Every repair follows the approved process, from assessment through to final checks.", supportEyebrow: "Why choose CA Autobody?", finalEyebrow: "CA Autobody", finalTitle: "Let’s talk about your BYD.", finalCopy: "Talk directly with our team about an assessment, repair options and your insurance claim." },
  },
  "lexus-approved-body-shop-melbourne": {
    brand: "Lexus",
    seoDescription: "CA Autobody is an approved Lexus body shop in Chelsea Heights, Melbourne. Genuine OEM parts, precision paint, ADAS support and claim help. Call us today.",
    eyebrow: "APPROVED LEXUS COLLISION REPAIRS IN MELBOURNE",
    title: "Lexus Approved Body Shop Melbourne",
    intro: "A Lexus repair must restore safety, body accuracy, finish quality and the quiet refinement expected from the vehicle. CA Autobody provides manufacturer-approved Lexus repairs using genuine OEM Lexus parts and approved repair procedures.",
    heroImage: media.brandRepair.lexusHero,
    heroAlt: "A panel beater inspecting vehicle damage in the workshop",
    logo: "/images/lexus_PNG57.webp",
    assessmentCta: "Enquire about a repair",
    contactCta: "Contact CA Autobody",
    serviceGuide: ["Lexus repair standards", "Wide range of services", "Why choose CA Autobody?"],
    approvalPoints: ["Approved Lexus Repairer", "Genuine OEM Lexus parts within the approved plan", "ADAS, structural and precision refinishing capability", "Claim assistance, towing and loan vehicle options"],
    approvalTitle: "Lexus approved repairer: our capabilities",
    approvalCopy: "A Lexus is built for comfort and precision, and a repair should preserve both. As an approved Lexus repairer in Chelsea Heights, CA Autobody combines genuine OEM parts, approved procedures and precision refinishing, so your vehicle looks and drives the way it should.",
    pillars: [
      { code: "OEM", title: "Genuine Lexus parts", copy: "Genuine OEM components support fit, materials compatibility and the approved repair method." },
      { code: "ADAS", title: "Safety system accuracy", copy: "Affected cameras, sensors and related systems are inspected and calibration needs are included in the plan." },
      { code: "CLR", title: "Precise colour and finish", copy: "Controlled preparation, colour matching and low bake refinishing help restore a consistent premium finish." },
      { code: "QC", title: "Detailed quality control", copy: "Panel alignment, function, finish and repair documentation are checked before handover." },
    ],
    principles: [
      { title: "Structural and body repairs", copy: "Accurate measuring, panel repair and fit within the approved scope." },
      { title: "Premium paint refinishing", copy: "Colour matching focused on consistency, gloss and finish." },
      { title: "ADAS calibration support", copy: "Diagnostic and calibration needs addressed for affected safety technology." },
      { title: "Genuine parts", copy: "Genuine OEM Lexus parts within the approved repair plan." },
    ],
    capabilities: [
      { title: "Approved Lexus repairs", copy: "Repairs follow manufacturer-approved procedures. Every vehicle is assessed beyond the visible damage, so nothing is missed." },
      { title: "Genuine OEM Lexus parts", copy: "Genuine components support fit, material compatibility and the approved repair method, subject to parts availability and approval." },
      { title: "Safety system accuracy", copy: "Affected cameras, sensors and related systems are inspected, and any calibration needed is built into the repair plan." },
      { title: "Precision colour and finish", copy: "Controlled preparation, colour matching and low bake refinishing help restore a consistent premium finish." },
      { title: "Insurance coordination", copy: "We prepare the estimate and repair information for your insurer and communicate with them directly where authorised." },
      { title: "Clear, caring customer experience", copy: "You get regular progress updates and final checks of panel alignment, function and finish. Towing and loan car options are available, subject to availability and eligibility." },
    ],
    systemsTitle: "Precision finishing in a controlled environment",
    systemsCopy: "The repair process combines manufacturer information, specialist body capability and carefully controlled refinishing for a complete result.",
    process: [
      { title: "Start your assessment", copy: "Call or upload photos and vehicle details. We will advise whether an inspection or towing is required." },
      { title: "Inspect and document", copy: "Damage, affected systems, structure and refinishing requirements are assessed." },
      { title: "Approve the repair plan", copy: "Parts, procedures, estimate and insurer requirements are confirmed." },
      { title: "Complete Lexus approved repairs", copy: "The team carries out the approved body, structural, paint and system related work." },
      { title: "Final quality and handover", copy: "Fit, finish, function and any diagnostic or calibration requirements are checked before return." },
    ],
    supportTitle: "Why Choose CA Autobody?",
    supportCopy: "Lexus owners expect a repair that restores more than the visible damage. CA Autobody pairs approved repair methods and genuine parts with clear communication, so you know what’s happening at every step. Whether it’s a minor repair or major structural work, we’re your local approved Lexus repairer in Chelsea Heights.",
    supportPoints: [],
    disclaimer: "Manufacturer warranty, insurance coverage, parts approval, towing and loan vehicle availability depend on the repair and your individual circumstances. We’ll explain what applies to your vehicle before any work starts.",
    faqs: [
      { question: "Is CA Autobody a Lexus Approved Repairer?", answer: "Yes. CA Autobody is a Lexus Approved Repairer in Melbourne. Current Lexus approved repairer, confirmed for your model." },
      { question: "Do you use genuine Lexus parts?", answer: "Genuine OEM Lexus parts are specified within the approved repair plan, subject to the repair scope, availability and claim approval." },
      { question: "Can you assist with an insurance claim?", answer: "Yes. CA Autobody can help prepare repair information and communicate with the insurer with the customer's authority." },
      { question: "Can you arrange towing or a loan car?", answer: "Towing and loan vehicle options are available. Conditions, availability and eligibility are confirmed for each repair." },
      { question: "Does the repair include a warranty?", answer: "CA Autobody offers a lifetime workmanship warranty subject to written terms, exclusions and correct vehicle care." },
    ],
    review: { rating: "4.9 · 300+ five star reviews from 352 Google reviews", quote: "The staff were super friendly, efficient and helpful. I received regular updates on progress of my car's repair. When the hire car ran out of time from the insurance company, CA Autobody gave me a free loan car to bridge the gap. The car was finished before the scheduled date despite having to get special parts in from the car manufacturer and looked brand new when I picked it up… I highly recommend CA autobody, especially for prestige cars.", author: "Zita P. Google review" },
    media: [
      { image: media.brandRepair.lexusHero, alt: "A professional panel beater inspecting vehicle damage with a customer", label: "Damage assessment" },
      { image: media.brandRepair.lexusFinish, alt: "Specialist preparing a vehicle finish", label: "Finish preparation" },
      { image: media.brandRepair.diagnostics, alt: "Automotive mechanic inspecting a vehicle with diagnostic software", label: "Diagnostic checks" },
    ],
    sections: { ...sharedSections, principlesEyebrow: "Wide range of services", principlesTitle: "Complete collision repair for Lexus owners.", capabilityEyebrow: "Lexus approved repairer", capabilityTitle: "Our capabilities", capabilityIntro: "Every repair follows the approved process, from assessment through to final checks.", supportEyebrow: "Why choose CA Autobody?", finalEyebrow: "CA Autobody", finalTitle: "Let’s talk about your Lexus.", finalCopy: "Talk directly with our team about an assessment, repair options and your insurance claim." },
  },
};

import { media } from "@/lib/media";

export type BrandRepairContent = {
  brand: "BYD" | "Lexus";
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  logo: string;
  assessmentCta: string;
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
  questions: Array<{ question: string; answer: string }>;
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
    questionsEyebrow: string;
    questionsTitle: string;
    questionsIntro: string;
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
  questionsEyebrow: "Protect your investment",
  questionsTitle: "Five questions to ask before authorising repairs",
  questionsIntro: "Use these questions to compare repairers and make a confident decision before authorising work.",
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
    eyebrow: "APPROVED BYD COLLISION REPAIRS IN MELBOURNE",
    title: "BYD Approved Repairer Melbourne",
    intro: "BYD vehicles combine high voltage architecture, battery systems, advanced driver assistance technology and model specific body structures. CA Autobody delivers approved BYD repairs using genuine OEM BYD parts and manufacturer approved procedures.",
    heroImage: media.brandRepair.bydHero,
    heroAlt: "Close-up of electric car charging",
    logo: "",
    assessmentCta: "Start My BYD Repair Assessment",
    approvalPoints: ["Approved BYD Repairer", "EV battery safe repair procedures", "Genuine OEM BYD parts within the approved plan", "Claim assistance, towing and loan vehicle options"],
    approvalTitle: "A modern BYD repair starts with EV safety",
    approvalCopy: "Even when impact damage looks cosmetic, the repair plan may need to consider high voltage isolation, battery protection, structural measurement, restraint systems and sensor alignment. Correct diagnosis and manufacturer information help prevent shortcuts and missed damage.",
    pillars: [
      { code: "BAT", title: "Battery safe work", copy: "Controlled isolation and inspection steps are planned around the vehicle and repair area." },
      { code: "BODY", title: "Body structure", copy: "Model specific measurements, joining methods and repair limits guide structural work." },
      { code: "ADAS", title: "Safety technology", copy: "Affected cameras, radar and driver assistance systems are identified and calibration needs are addressed." },
      { code: "OEM", title: "Genuine parts", copy: "Genuine OEM BYD parts support fit, system compatibility and the manufacturer approved repair method." },
    ],
    principles: [
      { title: "Assess beyond visible damage", copy: "Impact energy can affect structure, mounting points, restraints and electronics beyond the damaged panel." },
      { title: "Use model appropriate information", copy: "Repair limits, joining methods, parts and checks must match the affected model and repair area." },
      { title: "Document the repair pathway", copy: "Clear estimates, approvals, progress updates and final checks help customers understand what was completed." },
      { title: "Confirm warranty implications", copy: "Ask how the repair method aligns with manufacturer requirements and check the vehicle warranty and compliance position." },
    ],
    capabilities: [
      { title: "BYD damage assessment", copy: "Vehicle triage, damage mapping and a clear manufacturer aligned repair plan." },
      { title: "EV battery safety", copy: "High voltage isolation and repair area controls appropriate to the damage and model." },
      { title: "Structural and body repair", copy: "Measuring, panel, joining and refinish work completed to the approved scope." },
      { title: "ADAS and diagnostics", copy: "System scans and calibration requirements considered before final handover." },
      { title: "Insurance claim assistance", copy: "Estimate and repair information prepared for insurer review where applicable." },
      { title: "Towing and loan cars", copy: "Accident towing and complimentary loan car options, subject to availability and eligibility." },
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
    supportTitle: "Protect the repair pathway from the beginning",
    supportCopy: "Speak with CA Autobody before accepting a repair booking elsewhere. We will explain what to ask and what information is needed.",
    supportPoints: ["Genuine OEM BYD parts within the approved repair scope", "Direct repair progress updates", "Insurance claim assistance", "Accident towing where required", "Loan vehicle options, subject to terms"],
    disclaimer: "Manufacturer warranty, insurance coverage, parts approval, towing, loan vehicle and claim outcomes depend on the repair, applicable terms and individual circumstances. We explain what applies to your vehicle and claim before any work starts.",
    questions: [
      { question: "Are you officially approved by BYD?", answer: "Ask for proof that the approval is current and applies to the repair facility." },
      { question: "Do you use genuine OEM BYD parts?", answer: "Confirm the parts plan before authorising work and ask how any exceptions will be explained." },
      { question: "How will battery safety be managed?", answer: "The repairer should identify high voltage risks and establish safe procedures before work begins." },
      { question: "What happens to affected safety sensors?", answer: "Ask how diagnostics and calibration requirements will be assessed and recorded." },
      { question: "Can you manage the claim and mobility needs?", answer: "Confirm insurer communication, towing and loan car arrangements early." },
    ],
    faqs: [
      { question: "Is CA Autobody an Approved BYD Repairer?", answer: "Yes. CA Autobody is an Approved BYD Repairer in Melbourne. Current BYD approved repairer, confirmed for your model." },
      { question: "Will repairs follow BYD procedures?", answer: "Yes. The repair is planned around manufacturer approved procedures, genuine parts and model specific requirements. The final scope depends on the assessed damage." },
      { question: "Can you help if I have not lodged a claim?", answer: "Yes. Send the vehicle and accident details first so the team can explain the practical repair and claim information you may need." },
      { question: "Is a loan car guaranteed?", answer: "No. Loan or replacement vehicle availability and eligibility must be confirmed for the individual repair or claim." },
      { question: "What warranty applies?", answer: "CA Autobody offers a lifetime workmanship warranty subject to its written warranty terms and exclusions." },
    ],
    review: { rating: "4.9 ★★★★★ 300+ five star reviews from 352 Google reviews", quote: "I do not normally leave a review but in this case it is easy. The service we received from the initial contact up until the completion of our car repair was outstanding. Communication was excellent throughout the process, and the workmanship and quality of the repair is excellent. Could not be happier with the outcome.", author: "Rodney K. Google review" },
    media: [
      { image: media.brandRepair.bydHero, alt: "Close-up of electric car charging", label: "EV repair context" },
      { image: media.brandRepair.bydPanel, alt: "Car mechanic working to remove dent in workshop", label: "Panel repair" },
      { image: media.brandRepair.diagnostics, alt: "Automotive mechanic inspecting a vehicle with diagnostic software", label: "Diagnostic checks" },
    ],
    sections: { ...sharedSections, supportEyebrow: "Accident and claims support" },
  },
  "lexus-approved-body-shop-melbourne": {
    brand: "Lexus",
    eyebrow: "APPROVED LEXUS COLLISION REPAIRS IN MELBOURNE",
    title: "Lexus Approved Repairer Melbourne",
    intro: "A Lexus repair must restore safety, body accuracy, finish quality and the quiet refinement expected from the vehicle. CA Autobody provides manufacturer approved Lexus repairs using genuine OEM Lexus parts and approved repair procedures.",
    heroImage: media.brandRepair.lexusHero,
    heroAlt: "A panel beater inspecting vehicle damage in the workshop",
    logo: "",
    assessmentCta: "Start My Lexus Repair Assessment",
    approvalPoints: ["Approved Lexus Repairer", "Genuine OEM Lexus parts within the approved plan", "ADAS, structural and precision refinishing capability", "Claim assistance, towing and loan vehicle options"],
    approvalTitle: "Protect safety, refinement and long term value",
    approvalCopy: "Luxury collision repair is not simply about removing visible damage. The repair plan may need to restore body dimensions, occupant protection systems, driver assistance technology, finish quality, sealing and the fit that supports a quiet, refined driving experience.",
    pillars: [
      { code: "OEM", title: "Genuine Lexus parts", copy: "Genuine OEM components support fit, materials compatibility and the approved repair method." },
      { code: "ADAS", title: "Safety system accuracy", copy: "Affected cameras, sensors and related systems are inspected and calibration needs are included in the plan." },
      { code: "CLR", title: "Precise colour and finish", copy: "Controlled preparation, colour matching and low bake refinishing help restore a consistent premium finish." },
      { code: "QC", title: "Detailed quality control", copy: "Panel alignment, function, finish and repair documentation are checked before handover." },
    ],
    principles: [
      { title: "Assess beyond visible damage", copy: "Impact energy can affect structure, mounting points, restraints and electronics beyond the damaged panel." },
      { title: "Use model appropriate information", copy: "Repair limits, joining methods, parts and checks must match the affected model and repair area." },
      { title: "Document the repair pathway", copy: "Clear estimates, approvals, progress updates and final checks help customers understand what was completed." },
      { title: "Confirm warranty implications", copy: "Ask how the repair method aligns with manufacturer requirements and check the vehicle warranty and documentation." },
    ],
    capabilities: [
      { title: "Lexus damage assessment", copy: "A complete inspection and manufacturer aligned repair plan for the affected vehicle." },
      { title: "Structural and body repair", copy: "Accurate measuring, panel repair, joining and fit within the approved repair scope." },
      { title: "ADAS calibration support", copy: "Diagnostic and calibration requirements addressed for affected safety technology." },
      { title: "Genuine OEM Lexus parts", copy: "Genuine parts used within the authorised plan, subject to parts availability and approval." },
      { title: "Premium paint refinishing", copy: "Colour matching and controlled refinishing focused on consistency, gloss and finish." },
      { title: "Insurance and mobility support", copy: "Claim assistance, accident towing and complimentary loan car options, subject to terms." },
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
    supportTitle: "A premium repair experience without unnecessary confusion",
    supportCopy: "CA Autobody coordinates the practical steps, keeps you updated and explains the repair pathway in clear language.",
    supportPoints: ["Genuine OEM Lexus parts within the approved scope", "Direct insurer communication where authorised", "Accident towing assistance", "Repair progress updates", "Loan car options, subject to availability and eligibility"],
    disclaimer: "Manufacturer warranty, insurance coverage, parts approval, towing, loan vehicle and claim outcomes depend on the repair, applicable terms and individual circumstances. We explain what applies to your vehicle and claim before any work starts.",
    questions: [
      { question: "Are you officially approved by Lexus?", answer: "Ask for proof that the approval is current and applies to the repair facility." },
      { question: "Will genuine OEM Lexus parts be used?", answer: "Confirm the parts approach before work is authorised and ask how any variation will be explained." },
      { question: "How will safety systems be checked?", answer: "Ask what diagnostics and calibration steps apply to the affected Lexus model." },
      { question: "How will colour and finish quality be controlled?", answer: "The repairer should explain preparation, colour matching, refinishing and final inspection." },
      { question: "What warranty and documents will I receive?", answer: "Request the written warranty and retain repair and calibration documentation." },
    ],
    faqs: [
      { question: "Is CA Autobody a Lexus Approved Repairer?", answer: "Yes. CA Autobody is a Lexus Approved Repairer in Melbourne. Current Lexus approved repairer, confirmed for your model." },
      { question: "Do you use genuine Lexus parts?", answer: "Genuine OEM Lexus parts are specified within the approved repair plan, subject to the repair scope, availability and claim approval." },
      { question: "Can you assist with an insurance claim?", answer: "Yes. CA Autobody can help prepare repair information and communicate with the insurer with the customer's authority." },
      { question: "Can you arrange towing or a loan car?", answer: "Towing and loan vehicle options are available. Conditions, availability and eligibility are confirmed for each repair." },
      { question: "Does the repair include a warranty?", answer: "CA Autobody offers a lifetime workmanship warranty subject to written terms, exclusions and correct vehicle care." },
    ],
    review: { rating: "4.9 ★★★★★ 300+ five star reviews from 352 Google reviews", quote: "The staff were super friendly, efficient and helpful. I received regular updates on progress of my car's repair. When the hire car ran out of time from the insurance company, CA Autobody gave me a free loan car to bridge the gap. The car was finished before the scheduled date despite having to get special parts in from the car manufacturer and looked brand new when I picked it up… I highly recommend CA autobody, especially for prestige cars.", author: "Zita P. Google review" },
    media: [
      { image: media.brandRepair.lexusHero, alt: "A professional panel beater inspecting vehicle damage with a customer", label: "Damage assessment" },
      { image: media.brandRepair.lexusFinish, alt: "Specialist preparing a vehicle finish", label: "Finish preparation" },
      { image: media.brandRepair.diagnostics, alt: "Automotive mechanic inspecting a vehicle with diagnostic software", label: "Diagnostic checks" },
    ],
    sections: { ...sharedSections, supportEyebrow: "Accident and claim support" },
  },
};

import type { BlogContent, FAQContent, GalleryContent, LocationContent, OfferContent, ServiceContent } from "@/types/content";
import { originalServiceCopy } from "@/lib/originalServiceCopy";
import { insurerLogos, media, vehicleBrandLogos } from "@/lib/media";

export const site = {
  name: "CA Chelsea Autobody",
  phone: "03 9772 7411",
  phoneHref: "+61397727411",
  email: "info@caautobody.com.au",
  address: "7 Ashley Park Drive, Chelsea Heights, VIC 3196",
};

export const services: ServiceContent[] = [
  {
    slug: "accident-assistance",
    title: "Accident Assistance Melbourne",
    seoTitle: "Accident Assistance Services Melbourne | CA Autobody",
    eyebrow: "Accident Assistance",
    intro: "The CA Chelsea Autobody Privilege Program is our premium stress-free accident repair service.",
    body: [
      "From the time we receive your call until your Vehicle is returned to you, rebuilt to manufactures exacting standards, we’ll take care of everything. From getting you home, collecting your damaged vehicle, dealing with your insurance company to providing you with a vehicle rental and repairing your car.",
      "At the time of an accident, it is important to have someone to assist you through the process of having your vehicle repaired.",
      "CA Chelsea Autobody offer comprehensive assistance, with one of our client relation managers to help simplify the process and get you back on the road as soon as possible.",
      "Quite often, it may be the first time that you have had to make a motor insurance claim and knowing that our team is ready to answer your questions and assist you through the process can only add to your peace of mind."
    ],
    image: media.service.accident,
    highlights: ["Repair assessment", "Insurer coordination", "Towing guidance", "Repair updates"]
  },
  {
    slug: "paintless-dent-removal",
    title: "Paintless Dent Removal Melbourne",
    seoTitle: "Paintless Dent Removal Melbourne | CA Autobody",
    eyebrow: "Paintless Dent Removal",
    intro: "Welcome to CA Autobody, where we pride ourselves on being the leading provider of top-quality paintless dent removal in Melbourne.",
    body: [
      "Our trained technicians understand how frustrating it is to have unattractive dents and dings on your vehicle. That’s why we are committed to delivering speedy and effective solutions to restore your car’s appearance to its former glory. We can gently massage minor dents out without needing to paint and maintain your vehicle’s original surface while saving you time and money.",
      "With our dedication to expertise and client satisfaction, you can count on us to provide outcomes that meet your expectations. Whether your car has been damaged by a shopping trolley, hail or a minor mishap, we have the knowledge and skills to handle every dent removal task with accuracy and care. Don’t let dents detract from the beauty of your vehicle; visit our website today to arrange an appointment and let our team of experts restore your car’s look quickly, affordably, and without difficulty."
    ],
    image: media.service.paintlessDent,
    highlights: ["Factory paint preservation", "Minor dent assessment", "Precision reshaping", "Clean finish"]
  },
  {
    slug: "panel-beating",
    title: "Panel Beating Services Melbourne",
    seoTitle: "Panel Beater Melbourne | Panel Repair",
    eyebrow: "Panel Beating",
    intro: "Finding an experienced panel beater in Melbourne is key to keeping your vehicle in top shape.",
    body: [
      "With accidents being all too common in the city, quality repairs are a must. At CA Autobody, we’re here to provide reliable automotive repairs and restoration you can trust.",
      "With 30+ years of experience in the industry, we specialise in delivering high-quality panel beating repair services in Melbourne. Our dedicated team is skilled in repairing damaged panels, removing dents, fixing scratches, and replacing parts as needed. We focus on restoring your vehicle to its original condition, prioritising both safety and aesthetics.",
      "Contact us today for a free quote or to schedule a consultation!"
    ],
    image: media.service.panelBeating,
    highlights: ["Collision damage", "Panel alignment", "Structural checks", "Finish preparation"]
  },
  {
    slug: "replacement-vehicles",
    title: "Replacement Vehicles Melbourne",
    seoTitle: "Replacement Vehicles Melbourne | CA Autobody",
    eyebrow: "Replacement Vehicles",
    intro: "Are you in need of a replacement vehicle in Melbourne? Look no further than CA Autobody.",
    body: [
      "We understand that being without your car can be inconvenient, which is why we offer a hassle-free solution with our rental replacement vehicles. Whether your car is in for repairs or maintenance, we have various options available to suit your needs, ensuring you can stay on the move while your car is serviced.",
      "At CA Autobody, we take pride in providing our customers with reliable and well-maintained replacement vehicles. From compact cars for urban commuting to spacious SUVs for family outings, our diverse fleet accommodates various preferences and requirements. With competitive rates and flexible rental periods, getting behind the wheel of a replacement vehicle has never been easier or more convenient."
    ],
    image: media.service.replacementVehicles,
    highlights: ["Convenient transport", "Claim guidance", "Booking support", "Clear handover"]
  },
  {
    slug: "spray-painting",
    title: "Car Spray Painting Melbourne",
    seoTitle: "Car Spray Painting Melbourne | CA Autobody",
    eyebrow: "Spray Painting",
    intro: "Nothing beats a professional spray painting job when restoring your car’s appearance.",
    body: [
      "At CA Autobody, we offer top-quality car spray painting in Melbourne to help you achieve the perfect finish for your vehicle. Whether you’re looking to freshen up your car’s paintwork or completely transform its look, our team of competent technicians has the expertise and equipment to provide exceptional results that go above and beyond your expectations.",
      "Our car spray painting process begins with thorough preparation, including sanding, priming, and masking, to ensure a smooth and even finish. We use high-quality automotive paints matched to your vehicle’s original colour, providing a seamless blend with the existing paintwork. Whether you’re looking to refresh your car’s appearance or restore it to showroom condition, you can trust CA Autobody to deliver exceptional results that stand the test of time."
    ],
    image: media.service.sprayPainting,
    highlights: ["Colour matching", "Surface preparation", "Controlled refinishing", "Final quality inspection"]
  },
  {
    slug: "tesla-approved-repair-centre",
    title: "Tesla Approved Repair Centre Melbourne",
    seoTitle: "Tesla Approved Repair Centre Melbourne | CA Autobody",
    eyebrow: "Tesla Repair",
    intro: "In the ever-evolving world of automotive technology, Tesla stands out as a beacon of innovation and excellence.",
    body: [
      "With their cutting-edge electric vehicles (EVs), Tesla has revolutionised the automotive industry. However, with such advanced technology comes the need for specialised repair and maintenance services. This is where Tesla Approved Collision Centres like CA Autobody come into play. Located conveniently on the peninsula, CA Autobody offers state-of-the-art facilities and Tesla-certified technicians, ensuring that your Tesla vehicle is repaired to the highest standards."
    ],
    image: media.service.tesla,
    highlights: ["EV-aware repair process", "Modern body construction", "Precision refinishing", "Quality checks"]
  },
  {
    slug: "services-zeekr-approved-repairer-melbourne",
    title: "Zeekr Approved Repairer Melbourne",
    seoTitle: "Zeekr Approved Repairer Melbourne | CA Autobody",
    eyebrow: "Zeekr Repair",
    intro: "When your Zeekr has been damaged in an accident, choosing the right repairer matters.",
    body: [
      "Modern electric vehicles are built with advanced materials, safety systems, sensors, cameras, driver assistance technology and precise structural repair requirements. That means your Zeekr should be repaired by a team that understands the importance of correct repair methods, quality parts, accurate colour matching and careful workmanship.",
      "CA Autobody provides Zeekr approved accident repairs in Melbourne, helping owners restore their vehicles safely, professionally and with minimal stress. From our Chelsea Heights repair facility, we support Zeekr owners across Bayside, the south eastern suburbs and the Mornington Peninsula with panel repairs, spray painting, smash repairs, insurance claim assistance and replacement vehicle options.",
      "Whether your Zeekr has minor scratches, dent damage, bumper damage, panel damage or more complex collision repairs, our team can guide you through the process and help get your vehicle back on the road with confidence."
    ],
    image: media.service.zeekr,
    highlights: ["EV repair support", "Modern materials", "Careful assessment", "Final quality control"]
  },
  {
    slug: "byd-approved-repairer-melbourne",
    title: "BYD Approved Repairer Melbourne",
    seoTitle: "BYD Approved Repairer Melbourne | CA Autobody",
    eyebrow: "Approved BYD Collision Repairs in Melbourne",
    intro: "BYD vehicles combine high voltage architecture, battery systems, advanced driver assistance technology and model specific body structures. CA Autobody delivers approved BYD repairs using genuine OEM BYD parts and manufacturer approved procedures.",
    body: [
      "A modern BYD repair starts with EV safety.",
      "CA Autobody coordinates the practical steps, keeps you updated and explains the repair pathway in clear language."
    ],
    image: media.brandRepair.bydHero,
    highlights: ["Approved BYD Repairer", "EV battery safe repair procedures", "Genuine OEM BYD parts", "Claim assistance, towing and loan vehicle options"]
  },
  {
    slug: "lexus-approved-body-shop-melbourne",
    title: "Lexus Approved Body Shop Melbourne",
    seoTitle: "Lexus Approved Body Shop Melbourne | CA Autobody",
    eyebrow: "Approved Lexus Collision Repairs in Melbourne",
    intro: "A Lexus repair must restore safety, body accuracy, finish quality and the quiet refinement expected from the vehicle. CA Autobody provides manufacturer-approved Lexus repairs using genuine OEM Lexus parts and approved repair procedures.",
    body: [
      "Protect safety, refinement and long term value.",
      "CA Autobody coordinates the practical steps, keeps you updated and explains the repair pathway in clear language."
    ],
    image: media.brandRepair.lexusHero,
    highlights: ["Approved Lexus Repairer", "Genuine OEM Lexus parts", "ADAS, structural and precision refinishing capability", "Claim assistance, towing and loan vehicle options"]
  }
];

const locationMapData: Record<string, Pick<LocationContent, "coordinates" | "mapDescription">> = {
  aspendale: { coordinates: [-38.0268, 145.1027], mapDescription: "Bayside repair support, north-west of the Chelsea Heights workshop." },
  braeside: { coordinates: [-38.0063, 145.1169], mapDescription: "Convenient accident repair support for Braeside drivers." },
  carrum: { coordinates: [-38.073, 145.12], mapDescription: "South-east bayside support for collision and panel repairs." },
  chelsea: { coordinates: [-38.0529, 145.1171], mapDescription: "Local repair support close to Chelsea and the bayside." },
  cheltenham: { coordinates: [-37.9685, 145.0543], mapDescription: "Panel, paint and accident support for Cheltenham drivers." },
  edithvale: { coordinates: [-38.0376, 145.1075], mapDescription: "A short trip from Edithvale to the Chelsea Heights workshop." },
  mentone: { coordinates: [-37.9826, 145.0657], mapDescription: "Repair guidance and workshop support for Mentone motorists." },
  mordialloc: { coordinates: [-38.0058, 145.0867], mapDescription: "Bayside body repair and refinishing support for Mordialloc." },
  parkdale: { coordinates: [-37.9912, 145.0802], mapDescription: "Repair assessment and accident assistance for Parkdale drivers." },
  sandhurst: { coordinates: [-38.0291, 145.2099], mapDescription: "Local service coverage for Sandhurst and Melbourne's south-east." }
};

export const locations: LocationContent[] = [
  ["aspendale", "Aspendale", "Panel Beater Aspendale | Smash Repairs Aspendale | CA Chelsea Autobody"],
  ["braeside", "Braeside", "Panel Beater Braeside | Smash Repairs Braeside | CA Autobody"],
  ["carrum", "Carrum", "Panel Beater Carrum | Smash Repairs Carrum | CA Autobody"],
  ["chelsea", "Chelsea", "Panel Beater Chelsea | Smash Repairs Chelsea | CA Chelsea Autobody"],
  ["cheltenham", "Cheltenham", "Panel Beater Cheltenham | Smash Repairs Cheltenham"],
  ["edithvale", "Edithvale", "Panel Beater Edithvale | Smash Repairs | CA Autobody"],
  ["mentone", "Mentone", "Panel Beater Mentone | Smash Repairs Mentone | CA Autobody"],
  ["mordialloc", "Mordialloc", "Panel Beater Mordialloc | Smash Repairs Mordialloc | CA Chelsea Autobody"],
  ["parkdale", "Parkdale", "Panel Beater Parkdale | Smash Repairs Parkdale | CA Chelsea Autobody"],
  ["sandhurst", "Sandhurst", "Panel Beater Sandhurst | Smash Repairs Sandhurst | CA Chelsea Autobody"]
].map(([slug, name, seoTitle]) => ({
  slug,
  name,
  seoTitle,
  coordinates: locationMapData[slug].coordinates,
  mapDescription: locationMapData[slug].mapDescription,
  intro: `Professional smash repair and panel beating support for drivers in ${name} and surrounding Melbourne suburbs.`,
  body: [
    `CA Autobody supports ${name} drivers with accident repair, panel beating, refinishing and related repair services from our Chelsea Heights workshop.`,
    "Our focus is a clear repair process, careful workmanship and practical communication from the first assessment through to vehicle handover."
  ],
  image: media.hero.areas
}));

export const offers: OfferContent[] = [
  ["byd-approved-repairer-melbourne", "BYD Approved Repairer Melbourne", "BYD Approved Repairer Melbourne - CA Chelsea Autobody", "BYD Repair", "Specialist repair support for modern BYD electric vehicles."],
  ["fleet-and-commercial-repairs", "Fleet And Commercial Repairs", "Fleet And Commercial Repairs - CA Chelsea Autobody", "Fleet Repairs", "A practical repair pathway for fleet and commercial vehicles where uptime and communication matter."],
  ["lexus-approved-body-shop-melbourne", "Lexus Approved Body Shop Melbourne", "Lexus Approved Body Shop Melbourne - CA Chelsea Autobody", "Lexus Repair", "Premium collision repair support for Lexus vehicles with careful body and paint finishing."],
  ["not-at-fault-accident-repairs", "Not At Fault Accident Repairs", "Not At Fault Accident Repairs - CA Chelsea Autobody", "Not At Fault", "Guidance and repair support when you have been involved in an accident that was not your fault."],
  ["tesla-approved-body-shop-melbourne", "Tesla Approved Body Shop Melbourne", "Tesla Approved Body Shop Melbourne - CA Chelsea Autobody", "Tesla Repair", "Specialist accident repair support for Tesla owners in Melbourne."],
  ["zeekr-authorised-repairer-melbourne", "Zeekr Authorised Repairer Melbourne", "Zeekr Authorised Repairer Melbourne - CA Chelsea Autobody", "Zeekr Repair", "Specialist repair support for advanced Zeekr electric vehicles."]
].map(([slug, title, seoTitle, eyebrow, intro], index) => ({
  slug,
  title,
  seoTitle,
  eyebrow,
  intro,
  body: [
    "Modern collision repair requires a controlled process, the right repair approach and clear communication throughout the job.",
    "CA Autobody combines experienced technicians, a well-equipped Chelsea Heights facility and customer-focused repair coordination from assessment to handover."
  ],
  image: [media.brandRepair.bydHero, media.service.replacementVehicles, media.brandRepair.lexusHero, media.service.accident, media.service.tesla, media.service.zeekr][index],
  bullets: ["Initial assessment", "Repair planning", "Body and refinishing work", "Final quality review"]
}));

export const blogs: BlogContent[] = [
  {
    slug: "what-details-should-you-have-ready-before-booking-accident-repairs",
    title: "What Details Should You Have Ready Before Booking Accident Repairs?",
    date: "18 September 2026",
    category: "CA Knows",
    excerpt: "Booking accident repairs? Have vehicle details, impact location, photos, claim status and the car's current location ready before calling the workshop team.",
    image: media.service.accidentCard,
    status: "published"
  },
  {
    slug: "what-should-you-ask-before-choosing-a-tesla-collision-repairer",
    title: "What Should You Ask Before Choosing a Tesla Collision Repairer?",
    date: "7 September 2026",
    category: "CA Knows",
    excerpt: "Approval status, repair experience, replacement parts, communication and the repair process can all help you choose a Tesla collision repairer.",
    image: media.service.tesla,
    status: "published"
  },
  {
    slug: "can-a-damaged-car-panel-be-repaired-or-does-it-need-replacing",
    title: "Can a Damaged Car Panel Be Repaired or Does It Need Replacing?",
    date: "19 August 2026",
    category: "CA Knows",
    excerpt: "Key checks on dents, paint, mounting points and collision damage can help determine whether a panel is repaired or replaced.",
    image: media.service.panelBeating,
    status: "published"
  },
  {
    slug: "what-happens-after-your-tesla-is-damaged-in-an-accident",
    title: "What Happens After Your Tesla Is Damaged in an Accident?",
    date: "27 July 2026",
    category: "CA Knows",
    excerpt: "From assessment and panel work to paint, insurance details and final checks, understand the stages after Tesla accident damage.",
    image: media.service.teslaCentre,
    status: "published"
  },
  {
    slug: "what-melbourne-drivers-should-know-about-paintless-dent-removal",
    title: "What Melbourne Drivers Should Know About Paintless Dent Removal",
    date: "10 June 2026",
    category: "CA Knows",
    excerpt: "Paintless dent removal can help repair suitable small dents while preserving factory paint, depending on access and panel condition.",
    image: media.service.paintlessDent,
    status: "published"
  },
  {
    slug: "what-should-you-ask-before-choosing-a-panel-beater-in-sandhurst",
    title: "What Should You Ask Before Choosing a Panel Beater in Sandhurst?",
    date: "19 May 2026",
    category: "CA Knows",
    excerpt: "Ask about repair methods, warranties, communication, experience and replacement parts before choosing a repairer.",
    image: media.service.panelBeatingSupport,
    status: "published"
  },
  {
    slug: "smart-drivers-guide-to-finding-a-trustworthy-panel-beater-in-braeside",
    title: "The Smart Driver's Guide to Finding a Trustworthy Panel Beater in Braeside",
    date: "16 January 2026",
    category: "CA Knows",
    excerpt: "A practical guide to reputation, communication and repair quality when choosing a local panel beater.",
    image: media.workshop.exterior,
    status: "published"
  },
  {
    slug: "why-smash-repairs-in-mentone-are-worth-considering",
    title: "Need Help from a Local Specialist? Here's Why Smash Repairs in Mentone Are Worth Considering",
    date: "30 December 2025",
    category: "CA Knows",
    excerpt: "Local repair support can make communication and the repair journey easier after an accident.",
    image: media.service.accidentSupport,
    status: "published"
  },
  {
    slug: "what-really-happens-during-an-auto-accident-repair",
    title: "What Really Happens During an Auto Accident Repair: A Step-by-Step Walkthrough",
    date: "27 November 2025",
    category: "CA Knows",
    excerpt: "Understand the repair journey from initial assessment through body work, paint and final quality checks.",
    image: media.workshop.assessment,
    status: "published"
  },
  {
    slug: "got-a-dent-or-scratch-when-to-call-panel-beaters-in-carrum",
    title: "Got a Dent or Scratch? Here's When to Call Panel Beaters in Carrum",
    date: "21 October 2025",
    category: "CA Knows",
    excerpt: "Know when dents, scratches or collision damage should be professionally assessed and repaired.",
    image: media.service.panelBeating,
    status: "published"
  }
];

export const faqCategories = ["General", "Zeekr", "BYD", "Lexus", "Insurance", "Accident Assistance", "Paintless Dent Removal", "Panel Beating", "Spray Painting", "Replacement Vehicles"] as const;

const existingFaqSeeds: FAQContent[] = [
  { id: "general-1", category: "General", question: "How long will my vehicle repair take?", answer: "Repair times vary depending on the amount of the damage. We work hard to finish repairs on time while maintaining high quality.", visible: true },
  { id: "general-2", category: "General", question: "Can I get a quote before starting repairs?", answer: "We provide free, no-obligation quotes for all repair services.", visible: true },
  { id: "general-3", category: "General", question: "Do you offer towing services?", answer: "We provide towing services to move your vehicle to our facility for repair.", visible: true },
  { id: "general-4", category: "General", question: "Do you provide a warranty on repairs?", answer: "Yes, we back up our work with a lifetime repair warranty.", visible: true },
  { id: "general-5", category: "General", question: "How do I schedule an appointment?", answer: "Scheduling an appointment is easy. [Contact us](https://caautobody.com.au/contact/) via phone, email, or our website to book your service.", visible: true },
  { id: "general-6", category: "General", question: "Where is CA Autobody located?", answer: "CA Autobody is located at 7 Ashley Park Drive, Chelsea Heights, VIC 3196. We assist customers across Melbourne, Bayside, Kingston, Frankston and the Mornington Peninsula.", visible: true },
  { id: "zeekr-1", category: "Zeekr", question: "Do I need a Zeekr approved repairer after an accident?", answer: "For modern electric vehicles like Zeekr, it is important to choose a repairer that understands manufacturer repair standards, EV safety requirements, correct parts processes and advanced vehicle technology. This helps protect the quality, safety and value of the vehicle after an accident.", visible: true },
  { id: "zeekr-2", category: "Zeekr", question: "Can CA Autobody repair Zeekr accident damage?", answer: "Yes. CA Autobody can assist Zeekr owners with accident repairs, panel beating, spray painting, dent repairs, bumper repairs, insurance repair quoting and replacement vehicle options.", visible: true },
  { id: "zeekr-3", category: "Zeekr", question: "Can you help with my Zeekr insurance claim?", answer: "Yes. CA Autobody can assist with the accident repair process, including damage assessment, repair quoting and communication with insurers where required.", visible: true },
  { id: "zeekr-4", category: "Zeekr", question: "Do you offer replacement vehicles while my Zeekr is being repaired?", answer: "Yes. CA Autobody offers replacement vehicle options to help keep you on the road while your vehicle is in our care.", visible: true },
  { id: "zeekr-5", category: "Zeekr", question: "Can you repair Zeekr paint damage?", answer: "Yes. CA Autobody provides spray painting and colour matching for Zeekr vehicles, including scratch repairs, bumper painting, panel refinishing and paint repairs after collision damage.", visible: true },
  { id: "byd-1", category: "BYD", question: "Is CA Autobody an Approved BYD Repairer?", answer: "Yes. CA Autobody is an Approved BYD Repairer in Melbourne. Current BYD approved repairer, confirmed for your model.", visible: true },
  { id: "byd-2", category: "BYD", question: "Will repairs follow BYD procedures?", answer: "Yes. The repair is planned around manufacturer approved procedures, genuine parts and model specific requirements. The final scope depends on the assessed damage.", visible: true },
  { id: "byd-3", category: "BYD", question: "Can you help if I have not lodged a claim?", answer: "Yes. Send the vehicle and accident details first so the team can explain the practical repair and claim information you may need.", visible: true },
  { id: "byd-4", category: "BYD", question: "Is a loan car guaranteed?", answer: "No. Loan or replacement vehicle availability and eligibility must be confirmed for the individual repair or claim.", visible: true },
  { id: "byd-5", category: "BYD", question: "What warranty applies?", answer: "CA Autobody offers a lifetime workmanship warranty subject to its written warranty terms and exclusions.", visible: true },
  { id: "lexus-1", category: "Lexus", question: "Is CA Autobody a Lexus Approved Repairer?", answer: "Yes. CA Autobody is a Lexus Approved Repairer in Melbourne. Current Lexus approved repairer, confirmed for your model.", visible: true },
  { id: "lexus-2", category: "Lexus", question: "Do you use genuine Lexus parts?", answer: "Genuine OEM Lexus parts are specified within the approved repair plan, subject to the repair scope, availability and claim approval.", visible: true },
  { id: "lexus-3", category: "Lexus", question: "Can you assist with an insurance claim?", answer: "Yes. CA Autobody can help prepare repair information and communicate with the insurer with the customer's authority.", visible: true },
  { id: "lexus-4", category: "Lexus", question: "Can you arrange towing or a loan car?", answer: "Towing and loan vehicle options are available. Conditions, availability and eligibility are confirmed for each repair.", visible: true },
  { id: "lexus-5", category: "Lexus", question: "Does the repair include a warranty?", answer: "CA Autobody offers a lifetime workmanship warranty subject to written terms, exclusions and correct vehicle care.", visible: true },
  { id: "insurance-1", category: "Insurance", question: "How long will my vehicle repair take?", answer: "Repair times vary depending on the amount of the damage. We work hard to finish repairs on time while maintaining high quality.", visible: true },
  { id: "insurance-2", category: "Insurance", question: "Can I get a quote before starting repairs?", answer: "We provide free, no-obligation quotes for all repair services.", visible: true },
  { id: "insurance-3", category: "Insurance", question: "Do you offer towing services?", answer: "We provide towing services to move your vehicle to our facility for repair.", visible: true },
  { id: "insurance-4", category: "Insurance", question: "Do you provide a warranty on repairs?", answer: "Yes, we back up our work with a lifetime repair warranty.", visible: true },
  { id: "accident-1", category: "Accident Assistance", question: "Do I need to schedule an appointment for accident assistance?", answer: "Yes, we recommend scheduling an appointment so we can assess the damage and provide you with a detailed estimate for repairs.", visible: true },
  { id: "accident-2", category: "Accident Assistance", question: "What should I do immediately after a car accident?", answer: "First, ensure everyone is safe, then exchange insurance information with the other driver and take photos of the scene and any damage to your vehicle.", visible: true },
  { id: "accident-3", category: "Accident Assistance", question: "How long will it take to repair my vehicle after an accident?", answer: "The repair timeframe depends on the extent of the damage, but we’ll provide you with a timeline upfront so you know what to expect.", visible: true },
  { id: "accident-4", category: "Accident Assistance", question: "Are your technicians certified?", answer: "Yes, our professionals are highly qualified and certified to provide the best repairs for your vehicle.", visible: true },
  { id: "accident-5", category: "Accident Assistance", question: "What types of accident repairs do you offer?", answer: "We offer a full range of [auto accident repair services](https://caautobody.com.au/services/), including dent repair, panel beating, painting, and more.", visible: true },
  { id: "pdr-1", category: "Paintless Dent Removal", question: "What is paintless dent removal?", answer: "Paintless dent removal is a technique used to repair dents without the need for painting, preserving the original finish of the vehicle.", visible: true },
  { id: "pdr-2", category: "Paintless Dent Removal", question: "How long does paintless dent removal take?", answer: "The time required for paintless dent removal depends on the size and severity of the dent, but it’s typically faster than traditional dent repair methods.", visible: true },
  { id: "pdr-3", category: "Paintless Dent Removal", question: "Will paintless dent removal damage my car’s paint?", answer: "No, paintless dent removal is a non-invasive process that preserves your car’s original paint finish.", visible: true },
  { id: "pdr-4", category: "Paintless Dent Removal", question: "Can you remove all dents with paintless dent removal?", answer: "While paintless dent removal is effective for many types of dents, traditional repair methods may be necessary in some cases.", visible: true },
  { id: "pdr-5", category: "Paintless Dent Removal", question: "Can you repair dents on all types of vehicles?", answer: "Yes, our technicians are experienced in working with all vehicle makes and models, including cars, trucks, and SUVs.", visible: true },
  { id: "panel-1", category: "Panel Beating", question: "What is panel beating?", answer: "Panel beating is the repairing and reshaping of a vehicle’s metal panels damaged in accidents or collisions.", visible: true },
  { id: "panel-2", category: "Panel Beating", question: "How long does panel beating take?", answer: "The duration of panel beating repairs depends on the extent of the damage to your vehicle. Our team will provide an approximate timeframe based on your specific repair needs.", visible: true },
  { id: "panel-3", category: "Panel Beating", question: "Can you fix the rust damage on my vehicle?", answer: "Yes, our panel beaters are experienced in repairing rust damage and can restore your vehicle to its original condition.", visible: true },
  { id: "panel-4", category: "Panel Beating", question: "How much does panel beating cost?", answer: "Panel-beating repairs cost more or less depending on the degree of damage and the particular repair methods needed. Before any maintenance on your car, our staff will send you a comprehensive price.", visible: true },
  { id: "panel-5", category: "Panel Beating", question: "Can you match the paint colour of my vehicle?", answer: "Our technicians use advanced colour-matching technology to ensure a seamless finish matching your vehicle’s original paint colour.", visible: true },
  { id: "spray-1", category: "Spray Painting", question: "What is car spray painting?", answer: "Car spray painting is a method of applying paint to a vehicle’s exterior using a spray gun, resulting in a smooth, even finish.", visible: true },
  { id: "spray-2", category: "Spray Painting", question: "How long does car spray painting take?", answer: "The duration of a car spray painting job depends on various factors, including the extent of the work required and the paint drying time. Our team will provide an approximate timeline based on your specific needs.", visible: true },
  { id: "spray-3", category: "Spray Painting", question: "Can you match my car’s original paint colour?", answer: "Our technicians use advanced colour-matching technology to match your car’s original paint colour accurately.", visible: true },
  { id: "spray-4", category: "Spray Painting", question: "Do you offer custom paint finishes?", answer: "Yes, we offer a range of custom paint finishes, including metallic, pearl, and matte options, to help you achieve the perfect look for your vehicle.", visible: true },
  { id: "spray-5", category: "Spray Painting", question: "Can you repair scratches and dents before painting?", answer: "We offer paint correction services to repair scratches, dents, and other imperfections before applying the paint finish.", visible: true },
  { id: "replacement-1", category: "Replacement Vehicles", question: "What is an accident replacement vehicle?", answer: "An [accident replacement vehicle](https://caautobody.com.au/services/) is a temporary rental vehicle provided to individuals whose cars are being repaired following an accident. It allows them to maintain mobility while their vehicle is out of commission.", visible: true },
  { id: "replacement-2", category: "Replacement Vehicles", question: "How long can I rent an accident replacement vehicle?", answer: "The rental period for a replacement vehicle typically depends on the duration of repairs to your vehicle. Our team will work with you to find the appropriate rental period based on your needs.", visible: true },
  { id: "replacement-3", category: "Replacement Vehicles", question: "Are there any age restrictions for renting an accident replacement vehicle?", answer: "Yes, drivers must meet certain age requirements to rent a vehicle. Please contact us for more information on our age restrictions and rental policies.", visible: true },
  { id: "replacement-4", category: "Replacement Vehicles", question: "Can I choose the type of vehicle to replace my accident?", answer: "Yes, we offer various vehicle options to suit your preferences and requirements. Our team will work with you to select the right vehicle for your needs.", visible: true }
];

/** The client's 19-page DOCX is authoritative for these 30 service FAQs.
 * Other categories (General, Insurance, BYD, Lexus) retain existing content.
 */
export const serviceFaqCategories = new Set(
  Object.values(originalServiceCopy).filter((service) => service.faqs.length > 0).map((service) => service.category)
);
export const originalServiceFaqs: FAQContent[] = Object.values(originalServiceCopy).flatMap((service) =>
  service.faqs.map((faq, index) => ({
    id: `original-${service.slug}-${index + 1}`,
    category: service.category,
    question: faq.question,
    answer: faq.answer,
    visible: true,
  }))
);
export const faqs: FAQContent[] = [
  ...existingFaqSeeds.filter((faq) => !serviceFaqCategories.has(faq.category)),
  ...originalServiceFaqs,
];

export const gallery: GalleryContent[] = [
  { id: "gallery-facility", image: media.workshop.floor, caption: "The Chelsea Heights repair floor", category: "Facility" },
  { id: "gallery-exterior", image: media.workshop.exterior, caption: "CA Autobody in Chelsea Heights", category: "Facility" },
  { id: "gallery-reception", image: media.workshop.reception, caption: "Customer reception and vehicle handover", category: "Facility" },
  { id: "gallery-assessment", image: media.workshop.assessment, caption: "Vehicle assessment in progress", category: "Diagnostics" },
  { id: "gallery-structural", image: media.workshop.structural, caption: "Structural repair equipment", category: "Body Repair" },
  { id: "gallery-alignment", image: media.workshop.alignment, caption: "Precision measurement and alignment", category: "Diagnostics" },
  { id: "gallery-calibration", image: media.workshop.calibration, caption: "Calibration and repair systems", category: "Diagnostics" },
  { id: "gallery-equipment", image: media.workshop.equipment, caption: "Organised repair equipment", category: "Diagnostics" },
  { id: "gallery-paint", image: media.workshop.paintMixing, caption: "Colour preparation and paint mixing", category: "Refinishing" },
  { id: "gallery-body", image: media.workshop.bodyRepair, caption: "Body repair on a raised vehicle", category: "Body Repair" },
  { id: "gallery-tesla", image: media.service.tesla, caption: "Tesla repair capability", category: "EV Repair" },
  { id: "gallery-pdr", image: media.service.paintlessDent, caption: "Paintless dent repair in progress", category: "Body Repair" },
  { id: "gallery-panel", image: media.service.panelBeatingSupport, caption: "Panel repair equipment in the workshop", category: "Body Repair" },
  { id: "gallery-spray", image: media.service.sprayPainting, caption: "Controlled spray-paint application", category: "Refinishing" },
  { id: "gallery-workshop", image: "/images/Chelsea-Auto-Body-011.webp", caption: "Workshop prepared for modern repairs", category: "Facility" }
];

export const insurers = insurerLogos;

export const vehicleBrands = vehicleBrandLogos;

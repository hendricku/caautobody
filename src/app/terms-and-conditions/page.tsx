import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/Public/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Website use and general service information for CA Chelsea Autobody, Melbourne.",
  alternates: { canonical: "/terms-and-conditions" },
};

const sections: LegalSection[] = [
  {
    id: "using-site", title: "Using this website",
    paragraphs: ["This website provides general information about CA Chelsea Autobody and its vehicle repair and related services. By using this website, you agree to use it lawfully and not to interfere with its operation, security or availability.", "The content is intended for general information and is not a substitute for an individual repair assessment or professional advice about a particular vehicle."],
  },
  {
    id: "enquiries", title: "Enquiries, bookings and quotes",
    paragraphs: ["Submitting an online enquiry or contacting us does not itself create a confirmed booking or repair agreement. Any assessment, appointment, repair scope, cost, timing, parts requirements or replacement vehicle arrangement needs to be discussed and confirmed with our team.", "Online service descriptions and availability information may change. Final arrangements may depend on vehicle condition, inspection results, parts supply, third-party approvals and other circumstances."],
  },
  {
    id: "accuracy", title: "Website information",
    paragraphs: ["We aim to present helpful and accurate information, but website content, examples, images and descriptions may not reflect every vehicle, repair situation or current service arrangement.", "We may update website content without advance notice. Contact us to confirm information important to your decision or booking."],
  },
  {
    id: "insurance", title: "Insurance and third parties",
    paragraphs: ["Insurance claim assistance described on this website is general repair-process support. Whether an insurer accepts a claim, what is covered and any excess or related costs are matters governed by the applicable insurance policy and arrangements with the insurer.", "Links to third-party websites are provided for convenience. Their content and practices are managed by those third parties."],
  },
  {
    id: "intellectual-property", title: "Copyright and permitted use",
    paragraphs: ["Unless otherwise stated, the website layout, written content, graphics and other materials are made available for viewing in connection with learning about CA Chelsea Autobody. Trade names and brand marks remain the property of their respective owners.", "Please obtain permission before commercially reproducing website material or using our branding in a way that suggests endorsement."],
  },
  {
    id: "responsibility", title: "Responsibility and Australian consumer rights",
    paragraphs: ["We do not guarantee that the website will always be uninterrupted, error-free or free of security risks. Where permitted by law, we are not responsible for losses arising solely from reliance on general website information rather than confirmed service arrangements.", "Nothing in these website terms excludes, restricts or modifies rights or guarantees that cannot lawfully be excluded under the Australian Consumer Law or other applicable law."],
  },
  {
    id: "contact", title: "Questions and contact details",
    paragraphs: ["For questions about these terms or about a particular service, contact CA Chelsea Autobody at info@caautobody.com.au or 03 9772 7411.", "Visit us at 7 Ashley Park Drive, Chelsea Heights, VIC 3196."],
  },
  {
    id: "changes", title: "Changes to these terms",
    paragraphs: ["We may revise these website terms when site functionality or other relevant circumstances change. The version displayed here applies to use of the website from the time it is published."],
  },
];

export default function TermsAndConditionsPage() {
  return <LegalPage title="Terms & Conditions" eyebrow="Website information" description="Useful information about this website, service enquiries and your rights." sections={sections} counterpart={{label:"Privacy Policy",href:"/privacy-policy"}} />;
}

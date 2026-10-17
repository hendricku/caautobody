import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/Public/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn about personal information and privacy when contacting CA Chelsea Autobody through our website.",
  alternates: { canonical: "/privacy-policy" },
};

const sections: LegalSection[] = [
  {
    id: "overview", title: "Our approach to privacy",
    paragraphs: ["CA Chelsea Autobody provides automotive repair and related services in Chelsea Heights, Victoria. This notice explains how personal information supplied through our website may be collected, used, stored and shared in connection with your enquiry or service request.", "You can contact us if you have a question about this notice or how your information has been handled."],
  },
  {
    id: "information", title: "Information you provide",
    paragraphs: ["When you contact us or request an assessment, you may give us information needed to respond to you and discuss your vehicle or repairs."],
    points: ["Your name and contact details, such as your email address and telephone number.", "Vehicle and incident details you choose to provide, including repair requirements or relevant insurance information.", "Messages, photographs, attachments and other details you submit using a website form, email or another contact method."],
  },
  {
    id: "usage", title: "How information may be used",
    points: ["To respond to enquiries, provide estimates and arrange assessments or repairs.", "To communicate about your request, including where appropriate with repair, insurance or service providers involved in assisting you.", "To maintain website operations, protect against misuse and understand how the website is used where analytics tools are enabled.", "To comply with applicable legal obligations and address complaints or disputes."],
  },
  {
    id: "sharing", title: "Service providers and disclosures",
    paragraphs: ["Information may be handled by technology and operational service providers who help deliver website functionality, communications or vehicle-related services. Where relevant to a repair or insurance enquiry, details may also be shared with those participating in fulfilling your request.", "We recommend that you avoid sending sensitive details that are not needed for your enquiry through ordinary website forms."],
  },
  {
    id: "website", title: "Cookies and website analytics",
    paragraphs: ["With your permission, we use Google Analytics to understand aggregate website use, such as pages viewed, device category and traffic source. We do not send enquiry names, email addresses, phone numbers, messages, vehicle details or uploaded files to Google Analytics.", "You can accept, decline or change your analytics preference using Privacy choices in the website footer. Essential browser storage continues to support the website. Third-party websites linked from this site are subject to their own privacy information."],
  },
  {
    id: "security", title: "Storage, security and retention",
    paragraphs: ["We aim to limit access to information to those who need it for relevant business and website purposes and to apply appropriate safeguards. No internet transmission or storage system can be guaranteed completely secure.", "Information should be retained only for as long as needed for the relevant service, operational, record-keeping or legal purpose, then handled in accordance with applicable requirements."],
  },
  {
    id: "contact", title: "Access, questions and concerns",
    paragraphs: ["To ask about personal information you have provided, request a correction, or raise a privacy concern, contact CA Chelsea Autobody at info@caautobody.com.au or 03 9772 7411. We may need to confirm your identity before responding to a request involving personal information.", "CA Chelsea Autobody is located at 7 Ashley Park Drive, Chelsea Heights, VIC 3196."],
  },
  {
    id: "updates", title: "Changes to this notice",
    paragraphs: ["This notice may be updated when our website, services or applicable requirements change. Please review this page from time to time for the current version."],
  },
];

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy Policy" eyebrow="Your information" description="How we handle information shared when you contact us or use our website." sections={sections} counterpart={{label:"Terms & Conditions",href:"/terms-and-conditions"}} />;
}

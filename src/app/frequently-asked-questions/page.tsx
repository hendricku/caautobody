import type { Metadata } from "next";
import PageHero from "@/components/Common/PageHero";
import FAQList from "@/components/Public/FAQList";
import { faqs } from "@/lib/siteContent";

export const metadata: Metadata = { title: "Frequently Asked Questions - CA Chelsea Autobody" };

export default function FAQPage(){
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.filter((item) => item.visible).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") },
    })),
  };

  return (
    <main className="ca-faq-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <PageHero
        eyebrow="Helpful information"
        title="Frequently Asked Questions"
        image="https://caautobody.com.au/wp-content/uploads/2021/06/homepage-spray-paint.jpg"
        intro="Answers about repairs, insurance, replacement vehicles and specialist bodywork."
      />
      <section className="shell faq-section-wrap">
        <FAQList items={faqs} />
      </section>
    </main>
  );
}

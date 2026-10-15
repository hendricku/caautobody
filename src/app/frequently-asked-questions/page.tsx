import type { Metadata } from "next";
import PageHero from "@/components/Common/PageHero";
import FAQList from "@/components/Public/FAQList";
import { media } from "@/lib/media";
import { getPublishedFaqs } from "@/lib/cms/public-content";

export const metadata: Metadata = { title: "Frequently Asked Questions - CA Chelsea Autobody" };

export const revalidate = 60;

export default async function FAQPage(){
  const faqs = await getPublishedFaqs();
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
        image={media.hero.faq}
        intro="Answers about repairs, insurance, replacement vehicles and specialist bodywork."
      />
      <section className="shell faq-section-wrap">
        <FAQList items={faqs} />
      </section>
    </main>
  );
}

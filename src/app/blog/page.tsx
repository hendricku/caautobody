import type { Metadata } from "next";
import PageHero from "@/components/Common/PageHero";
import BlogIndexClient from "@/components/Public/BlogIndexClient";
import { media } from "@/lib/media";

export const metadata: Metadata = { title: "Car Repair Blog Melbourne | CA Autobody" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const activeCategory = category === "client-stories" ? "Client Stories" : "CA Knows";
  return (
    <main>
      <PageHero
        eyebrow="Advice & updates"
        title="CA Autobody Blogs"
        image={media.workshop.floor}
        intro="Guides, explainers and workshop insight covering accident repairs, panel work, electric vehicles and the repair process."
      />
      <BlogIndexClient category={activeCategory} />
    </main>
  );
}

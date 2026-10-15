import type { Metadata } from "next";
import PageHero from "@/components/Common/PageHero";
import GalleryGrid from "@/components/Public/GalleryGrid";
import { media } from "@/lib/media";
import { getPublishedGallery } from "@/lib/cms/public-content";

export const metadata: Metadata = { title: "Gallery | CA Chelsea Autobody" };

export const revalidate = 60;

export default async function GalleryPage(){
  const gallery = await getPublishedGallery();
  return (
    <main>
      <PageHero eyebrow="Workshop & repairs" title="Gallery" image={media.hero.gallery} intro="A closer look at the Chelsea Heights facility, repair work and refinishing environment behind the finished result."/>
      <section className="editorial-grid shell section-pad gallery-intro hp-reveal"><div><span className="eyebrow">Inside CA Autobody</span><h2>A workshop built around precise, modern repair work.</h2></div><div className="copy-stack"><p>Explore workshop, body repair, refinishing and EV repair imagery in a responsive Bento gallery. Select any image for a larger view and move through the collection with the keyboard, controls or swipe gestures.</p></div></section>
      <section className="shell gallery-section-pad"><GalleryGrid items={gallery}/></section>
    </main>
  );
}

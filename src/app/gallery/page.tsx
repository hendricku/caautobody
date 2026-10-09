import type { Metadata } from "next";
import PageHero from "@/components/Common/PageHero";
import GalleryGrid from "@/components/Public/GalleryGrid";
import { gallery } from "@/lib/siteContent";

export const metadata: Metadata = { title: "Gallery | CA Chelsea Autobody" };

export default function GalleryPage(){
  return (
    <main>
      <PageHero eyebrow="Workshop & repairs" title="Gallery" image="https://caautobody.com.au/wp-content/uploads/2021/06/homepage-Replacement-Vehicles.jpg" intro="A closer look at the Chelsea Heights facility, repair work and refinishing environment behind the finished result."/>
      <section className="editorial-grid shell section-pad gallery-intro hp-reveal"><div><span className="eyebrow">Inside CA Autobody</span><h2>A workshop built around precise, modern repair work.</h2></div><div className="copy-stack"><p>Explore workshop, body repair, refinishing and EV repair imagery in a responsive Bento gallery. Select any image for a larger view and move through the collection with the keyboard, controls or swipe gestures.</p></div></section>
      <section className="shell gallery-section-pad"><GalleryGrid items={gallery}/></section>
    </main>
  );
}

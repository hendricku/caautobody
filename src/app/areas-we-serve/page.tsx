import type { Metadata } from "next";
import PageHero from "@/components/Common/PageHero";
import ServiceAreaMap from "@/components/Public/ServiceAreaMap";
import { locations } from "@/lib/siteContent";

export const metadata: Metadata = { title: "Areas We Serve | Car Damage Repair Services in Melbourne" };

export default function AreasPage(){
  return (
    <main>
      <PageHero eyebrow="Local repair support" title="Areas We Serve" image="https://caautobody.com.au/wp-content/uploads/2021/05/ft-img.png" intro="CA Autobody supports drivers from Chelsea Heights and surrounding suburbs with collision repair, panel work, refinishing and accident assistance."/>
      <section className="editorial-grid shell section-pad hp-reveal"><div><span className="eyebrow">Chelsea Heights workshop</span><h2>Repair support across Melbourne’s bayside and nearby suburbs.</h2></div><div className="copy-stack"><p>Our Chelsea Heights location supports drivers from surrounding suburbs with accident repairs, insurer assistance and convenient workshop access.</p><p>Use the map to find your suburb and see its position relative to our workshop. Each local page has more detail about the repair support available to drivers in that area.</p></div></section>
      <ServiceAreaMap locations={locations} />
    </main>
  );
}

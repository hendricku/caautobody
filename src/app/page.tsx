import HomeV4 from "@/components/Public/HomeV4";
import { getPublishedHomeHero, getPublishedHomeVideo } from "@/lib/cms/public-content";
export default async function HomePage() {
  const [hero, videoId] = await Promise.all([getPublishedHomeHero(), getPublishedHomeVideo()]);
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://caautobody.com.au").replace(/\/+$/, "");
  const schema = {
    "@context": "https://schema.org", "@type": "AutoBodyShop", name: "CA Chelsea Autobody",
    url: `${base}/`, logo: `${base}/images/Gold.webp`, image: `${base}/images/Chelsea-Auto-Body-003.webp`,
    telephone: "+61397727411", email: "info@caautobody.com.au",
    description: "Smash repair, panel beating, refinishing, accident assistance and EV repair services from Chelsea Heights, Melbourne.",
    address: { "@type": "PostalAddress", streetAddress: "7 Ashley Park Drive", addressLocality: "Chelsea Heights", addressRegion: "VIC", postalCode: "3196", addressCountry: "AU" },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "17:00" }],
    areaServed: ["Aspendale", "Braeside", "Carrum", "Chelsea", "Cheltenham", "Edithvale", "Mentone", "Mordialloc", "Parkdale", "Sandhurst"],
    sameAs: ["https://www.facebook.com/CA-Chelsea-AutoBody-105411534900916/", "https://www.instagram.com/chelseaautobody/"],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><HomeV4 hero={hero} videoId={videoId}/></>;
}

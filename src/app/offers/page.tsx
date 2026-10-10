import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/Common/PageHero";
import { offers } from "@/lib/siteContent";
import { media } from "@/lib/media";
export const metadata: Metadata = { title: "Offers - CA Chelsea Autobody" };
export default function OffersPage(){return <main><PageHero eyebrow="Specialist repair programs" title="Repair support tailored to the vehicle and the situation." image={media.service.tesla} intro="Explore manufacturer-focused, fleet and accident repair support available through CA Autobody."/><section className="shell section-pad"><div className="offer-grid">{offers.map((offer,index)=><Link key={offer.slug} href={`/offers/${offer.slug}`}><span>{String(index+1).padStart(2,"0")}</span><div><small>{offer.eyebrow}</small><h2>{offer.title}</h2><p>{offer.intro}</p><b>Explore →</b></div></Link>)}</div></section></main>}

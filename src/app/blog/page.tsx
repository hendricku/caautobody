import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/Common/PageHero";
import BlogIndexClient from "@/components/Public/BlogIndexClient";

export const metadata: Metadata = { title: "Car Repair Blog Melbourne | CA Autobody" };

export default function BlogPage() {
  return <main><PageHero eyebrow="Advice & updates" title="CA Autobody Blogs" image="https://caautobody.com.au/wp-content/uploads/2021/06/homepage-spray-paint.jpg" intro="Guides, explainers and workshop insight covering accident repairs, panel work, electric vehicles and the repair process." /><section className="blog-category-gates shell section-pad hp-reveal"><Link href="/blog/ca-knows"><small>Repair knowledge</small><h2>CA Knows</h2><p>Practical repair explainers, accident guidance and workshop knowledge.</p><b>Explore CA Knows →</b></Link><Link href="/blog/client-stories"><small>Customer journeys</small><h2>Client Stories</h2><p>Completed repair journeys and stories from the people we help.</p><b>Explore Client Stories →</b></Link></section><BlogIndexClient /></main>;
}

import PageHero from "@/components/Common/PageHero";
import BlogIndexClient from "@/components/Public/BlogIndexClient";
import { media } from "@/lib/media";
export default function Page(){return <main><PageHero eyebrow="Blog category" title="CA Autobody Knows" image={media.workshop.diagnostics} intro="Repair explainers, accident guidance and practical workshop knowledge."/><BlogIndexClient category="CA Knows" /></main>}

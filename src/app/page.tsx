import HomeV4 from "@/components/Public/HomeV4";
import { getPublishedHomeHero } from "@/lib/cms/public-content";
export default async function HomePage() { const hero = await getPublishedHomeHero(); return <HomeV4 hero={hero}/>; }

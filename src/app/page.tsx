import HomeV4 from "@/components/Public/HomeV4";
import { getPublishedHomeHero, getPublishedHomeVideo } from "@/lib/cms/public-content";
export default async function HomePage() { const [hero, videoId] = await Promise.all([getPublishedHomeHero(), getPublishedHomeVideo()]); return <HomeV4 hero={hero} videoId={videoId}/>; }

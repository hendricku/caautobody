import { notFound } from "next/navigation";
import HomeV4 from "@/components/Public/HomeV4";
import { getAdmin } from "@/lib/cms/admin-server";
import { getPublishedHomeHero } from "@/lib/cms/public-content";
import { youtubeVideoId } from "@/lib/homepage-video";
export default async function HomepageVideoPreview() {
  const admin = await getAdmin();
  if (!admin) notFound();
  const { data, error } = await admin.client.from("cms_page_sections").select("content").eq("page_key", "home").eq("section_key", "about-video-draft").eq("status", "draft").maybeSingle();
  const videoId = youtubeVideoId(data?.content?.videoId);
  if (error || !videoId) notFound();
  const hero = await getPublishedHomeHero();
  return <><div className="admin-preview-bar"><div><span>Private preview</span><strong>Homepage with the saved video draft. Only signed-in CMS staff can see this.</strong></div></div><HomeV4 hero={hero} videoId={videoId} /></>;
}

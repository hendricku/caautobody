import Link from "next/link";
import { notFound } from "next/navigation";
import GalleryGrid from "@/components/Public/GalleryGrid";
import { getAdmin } from "@/lib/cms/admin-server";
import { mapGallery } from "@/lib/cms/public-content";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function GalleryPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdmin();
  if (!admin) notFound();

  const { data, error } = await admin.client.from("cms_gallery_items").select("*").eq("legacy_key", id).maybeSingle();
  if (error || !data) notFound();
  const item = mapGallery(data);

  return <><div className="admin-preview-bar"><div><span>Private preview</span><strong>{item.status === "draft" ? "Draft. Only signed-in CMS staff can see this page." : "Published gallery preview."}</strong></div><Link href={`/caautobodyadmin/gallery/${encodeURIComponent(item.id)}`}>Back to editor</Link></div><main className="content-section"><GalleryGrid items={[item]} /></main></>;
}

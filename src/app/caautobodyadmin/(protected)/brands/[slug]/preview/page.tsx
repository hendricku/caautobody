import Link from "next/link";
import { notFound } from "next/navigation";
import ServicePage from "@/components/Public/ServicePage";
import { getAdmin } from "@/lib/cms/admin-server";
import { isBrandPage } from "@/lib/cms/brand-pages";
import { mapService } from "@/lib/cms/public-content";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function BrandPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = await getAdmin();
  if (!admin) notFound();
  const { data, error } = await admin.client.from("cms_services").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) notFound();
  const service = mapService(data);
  if (!isBrandPage(service)) notFound();
  return <><div className="admin-preview-bar"><div><span>Private preview</span><strong>{service.status === "draft" ? "Draft. Only signed-in CMS staff can see this page." : "Published brand-page preview."}</strong></div><Link href={`/caautobodyadmin/brands/${service.slug}`}>Back to editor</Link></div><ServicePage service={service} /></>;
}

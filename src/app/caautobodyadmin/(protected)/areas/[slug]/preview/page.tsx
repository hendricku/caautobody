import Link from "next/link";
import { notFound } from "next/navigation";
import LocationPage from "@/components/Public/LocationPage";
import { getAdmin } from "@/lib/cms/admin-server";
import { mapLocation } from "@/lib/cms/public-content";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function AreaPreviewPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const admin = await getAdmin(); if (!admin) notFound(); const { data, error } = await admin.client.from("cms_locations").select("*").eq("slug", slug).maybeSingle(); if (error || !data) notFound(); const location = mapLocation(data); return <><div className="admin-preview-bar"><div><span>Private preview</span><strong>{location.status === "draft" ? "Draft. Only signed-in CMS staff can see this page." : "Published area preview."}</strong></div><Link href={`/caautobodyadmin/areas/${location.slug}`}>Back to editor</Link></div><LocationPage location={location} /></>; }

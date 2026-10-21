import Link from "next/link";
import { notFound } from "next/navigation";
import OfferPage from "@/components/Public/OfferPage";
import { getAdmin } from "@/lib/cms/admin-server";
import { mapOffer } from "@/lib/cms/public-content";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function OfferPreviewPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const admin = await getAdmin(); if (!admin) notFound(); const { data, error } = await admin.client.from("cms_offers").select("*").eq("slug", slug).maybeSingle(); if (error || !data) notFound(); const offer = mapOffer(data); return <><div className="admin-preview-bar"><div><span>Private preview</span><strong>{offer.status === "draft" ? "Draft. Only signed-in CMS staff can see this page." : "Published offer preview."}</strong></div><Link href={`/caautobodyadmin/offers/${offer.slug}`}>Back to editor</Link></div><OfferPage offer={offer} /></>; }

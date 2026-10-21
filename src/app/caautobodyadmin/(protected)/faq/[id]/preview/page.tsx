import Link from "next/link";
import { notFound } from "next/navigation";
import FAQList from "@/components/Public/FAQList";
import { getAdmin } from "@/lib/cms/admin-server";
import { mapFaq } from "@/lib/cms/public-content";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function FaqPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdmin();
  if (!admin) notFound();

  const { data, error } = await admin.client.from("cms_faqs").select("*").eq("legacy_key", id).maybeSingle();
  if (error || !data) notFound();
  const faq = mapFaq(data);

  return <><div className="admin-preview-bar"><div><span>Private preview</span><strong>{faq.status === "draft" ? "Draft. Only signed-in CMS staff can see this page." : "Published FAQ preview."}</strong></div><Link href={`/caautobodyadmin/faq/${encodeURIComponent(faq.id)}`}>Back to editor</Link></div><main className="content-section"><FAQList items={[faq]} /></main></>;
}

import AdminStructuredEditor from "@/components/Admin/AdminStructuredEditor";
export default async function OfferEditorPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <AdminStructuredEditor collection="offers" slug={slug} />; }

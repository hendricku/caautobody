import AdminStructuredEditor from "@/components/Admin/AdminStructuredEditor";
export default async function AreaEditorPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <AdminStructuredEditor collection="areas" slug={slug} />; }

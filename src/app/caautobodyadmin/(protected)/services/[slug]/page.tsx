import AdminServiceEditor from "@/components/Admin/AdminServiceEditor";
export default async function ServiceEditorPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <AdminServiceEditor slug={slug} />; }

import AdminLibraryEditor from "@/components/Admin/AdminLibraryEditor";
export default async function FaqEditorPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminLibraryEditor collection="faqs" id={id} />; }

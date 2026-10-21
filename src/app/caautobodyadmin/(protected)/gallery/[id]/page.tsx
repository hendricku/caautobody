import AdminLibraryEditor from "@/components/Admin/AdminLibraryEditor";
export default async function GalleryEditorPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminLibraryEditor collection="gallery" id={id} />; }

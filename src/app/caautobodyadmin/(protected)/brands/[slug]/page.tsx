import AdminServiceEditor from "@/components/Admin/AdminServiceEditor";

export default async function BrandEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AdminServiceEditor slug={slug} kind="brand" />;
}

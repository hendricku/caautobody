import AdminBlogSettingsEditor from "@/components/Admin/AdminBlogSettingsEditor";
export default async function BlogSettingsPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <AdminBlogSettingsEditor slug={slug} />; }

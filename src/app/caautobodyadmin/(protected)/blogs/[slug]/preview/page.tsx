import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogPostClient from "@/components/Public/BlogPostClient";
import { getAdmin } from "@/lib/cms/admin-server";
import { getPublishedBlogs } from "@/lib/cms/public-content";
import type { BlogContent } from "@/types/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value: unknown) => typeof value === "string" ? value : "";

function mapPreviewArticle(row: Record<string, unknown>): BlogContent {
  return {
    slug: text(row.slug),
    title: text(row.title),
    date: text(row.display_date),
    category: row.category === "Client Stories" ? "Client Stories" : "CA Knows",
    excerpt: text(row.excerpt),
    image: text(row.image_path),
    status: row.status === "published" ? "published" : "draft",
    blocks: Array.isArray(row.blocks) ? row.blocks as BlogContent["blocks"] : [],
  };
}

export default async function BlogPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!validSlug.test(slug)) notFound();
  const admin = await getAdmin();
  if (!admin) notFound();
  const { data, error } = await admin.client
    .from("cms_blog_posts")
    .select("slug,title,display_date,category,excerpt,image_path,status,blocks")
    .eq("slug", slug)
    .neq("status", "retired")
    .maybeSingle();
  if (error || !data) notFound();

  const article = mapPreviewArticle(data as Record<string, unknown>);
  const posts = await getPublishedBlogs();
  return <>
    <div className="admin-preview-bar"><div><span>Private preview</span><strong>{article.status === "draft" ? "Draft. Only signed-in CMS staff can see this page." : "Published article preview."}</strong></div><Link href={`/caautobodyadmin/blogs/${article.slug}`}>Back to editor</Link></div>
    <BlogPostClient article={article} posts={posts} />
  </>;
}

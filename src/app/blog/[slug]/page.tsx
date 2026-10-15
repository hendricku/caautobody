import type { Metadata } from "next";
import BlogPostClient from "@/components/Public/BlogPostClient";

import { notFound } from "next/navigation";
import { getPublishedBlogBySlug, getPublishedBlogs } from "@/lib/cms/public-content";

export async function generateStaticParams() { return []; }
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const post = await getPublishedBlogBySlug(slug); return post ? { title: post.title, description: post.excerpt, alternates: { canonical: `/blog/${post.slug}` } } : { title: "CA Autobody Blog" }; }
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const [article, posts] = await Promise.all([getPublishedBlogBySlug(slug), getPublishedBlogs()]); if (!article) notFound(); return <BlogPostClient article={article} posts={posts} />; }

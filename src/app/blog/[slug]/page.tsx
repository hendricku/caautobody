import type { Metadata } from "next";
import BlogPostClient from "@/components/Public/BlogPostClient";
import { blogs } from "@/lib/siteContent";

export async function generateStaticParams() { return blogs.map((post) => ({ slug: post.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const post = blogs.find((item) => item.slug === slug); return post ? { title: post.title, description: post.excerpt } : { title: "CA Autobody Blog" }; }
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <BlogPostClient slug={slug} />; }

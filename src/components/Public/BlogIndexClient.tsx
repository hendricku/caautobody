"use client";
import Image from "next/image";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { localBlogImageFor } from "@/lib/media";
import type { BlogCategory, BlogContent } from "@/types/content";

const categories: Array<{ label: BlogCategory; query: string; description: string }> = [
  { label: "CA Knows", query: "", description: "Repair guides and workshop knowledge." },
  { label: "Client Stories", query: "client-stories", description: "Real experiences from CA Autobody customers." },
];

export default function BlogIndexClient({ category = "CA Knows", posts }: { category?: BlogCategory; posts: BlogContent[] }) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<BlogCategory>(category);
  const [shown, setShown] = useState(9);
  const visiblePosts = posts.filter((post) => post.status === "published" && post.category === activeCategory);

  useEffect(() => { setActiveCategory(category); setShown(9); }, [category]);
  const selectCategory = (nextCategory: BlogCategory, query: string) => {
    setActiveCategory(nextCategory);
    setShown(9);
    router.replace(query ? `/blog?category=${query}` : "/blog", { scroll: false });
  };
  const categoryNav = <nav className="blog-category-switcher" aria-label="Blog categories">{categories.map((item, index) => <button key={item.label} id={`blog-category-${item.query || "ca-knows"}`} type="button" className={item.label === activeCategory ? "is-active" : ""} aria-pressed={item.label === activeCategory} aria-controls="blog-category-results" onClick={() => selectCategory(item.label, item.query)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><small>{item.description}</small></button>)}</nav>;
  if (!visiblePosts.length) return <section className="shell blog-editorial-section section-pad">{categoryNav}<div className="blog-category-empty" id="blog-category-results" aria-live="polite"><h2>{activeCategory === "Client Stories" ? "Real repair experiences will appear here." : "No articles have been published yet."}</h2><p>Check back soon, or speak with the team about your repair.</p><Link className="text-link" href="/contact">Contact the team <span aria-hidden="true">→</span></Link></div></section>;
  return <section className="shell blog-editorial-section section-pad">{categoryNav}<div className="blog-grid" id="blog-category-results" aria-live="polite">{visiblePosts.slice(0, shown).map((post) => <Link key={post.slug} href={`/blog/${post.slug}`}><Image src={post.image || localBlogImageFor(post.slug)} alt=""  width={1600} height={900} unoptimized /><div><small>{post.category} <span aria-hidden="true">/</span> {post.date}</small><h3>{post.title}</h3><p>{post.excerpt}</p><b>Read more <span aria-hidden="true">&rarr;</span></b></div></Link>)}</div><p className="sr-only" aria-live="polite">Showing {Math.min(shown, visiblePosts.length)} of {visiblePosts.length} articles.</p>{shown < visiblePosts.length ? <div className="blog-load-more"><button type="button" onClick={() => setShown((count) => count + 9)}>See more articles <span aria-hidden="true">&rarr;</span></button></div> : null}</section>;
}

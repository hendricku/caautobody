"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useImportedBlogs } from "@/lib/useImportedBlogs";
import { localBlogImageFor } from "@/lib/media";
import type { BlogCategory } from "@/types/content";

const categories: Array<{ label: BlogCategory; query: string; description: string }> = [
  { label: "CA Knows", query: "", description: "Repair guides and workshop knowledge." },
  { label: "Client Stories", query: "client-stories", description: "Real experiences from CA Autobody customers." },
];

export default function BlogIndexClient({ category = "CA Knows" }: { category?: BlogCategory }) {
  const router = useRouter();
  const { items, imported } = useImportedBlogs();
  const [activeCategory, setActiveCategory] = useState<BlogCategory>(category);
  const [shown, setShown] = useState(9);
  const posts = items.filter((post) => post.status === "published" && post.category === activeCategory);

  useEffect(() => {
    setActiveCategory(category);
    setShown(9);
  }, [category]);

  const selectCategory = (nextCategory: BlogCategory, query: string) => {
    if (nextCategory === activeCategory) return;
    setActiveCategory(nextCategory);
    setShown(9);
    router.replace(query ? `/blog?category=${query}` : "/blog", { scroll: false });
  };

  const categoryNav = <nav className="blog-category-switcher" aria-label="Blog categories">{categories.map((item, index) => <button key={item.label} id={`blog-category-${item.query || "ca-knows"}`} type="button" className={item.label === activeCategory ? "is-active" : ""} aria-pressed={item.label === activeCategory} aria-controls="blog-category-results" onClick={() => selectCategory(item.label, item.query)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><small>{item.description}</small></button>)}</nav>;

  if (!posts.length) {
    if (!imported && activeCategory === "CA Knows") return null;
    return <section className="shell blog-editorial-section section-pad">{categoryNav}<div className="blog-category-empty" id="blog-category-results" aria-live="polite">{activeCategory === "Client Stories" ? <><span>Client Stories</span><h2>Real repair experiences will appear here.</h2><p>We only publish client stories with permission. Check back soon, or speak with the team about your repair.</p><Link className="text-link" href="/contact">Contact the team <span aria-hidden="true">→</span></Link></> : <><h2>No articles have been published yet.</h2><p>Please check back soon for practical repair guidance from CA Autobody.</p></>}</div></section>;
  }

  return <section className="shell blog-editorial-section section-pad">
    {categoryNav}
    <div className="blog-grid" id="blog-category-results" aria-live="polite">
      {posts.slice(0, shown).map((post) => <Link key={post.slug} href={`/blog/${post.slug}`}><img src={localBlogImageFor(post.slug)} alt="" /><div><small>{post.category} <span aria-hidden="true">/</span> {post.date}</small><h3>{post.title}</h3><p>{post.excerpt}</p><b>Read more <span aria-hidden="true">&rarr;</span></b></div></Link>)}
    </div>
    <p className="sr-only" aria-live="polite">Showing {Math.min(shown, posts.length)} of {posts.length} articles.</p>
    {shown < posts.length ? <div className="blog-load-more"><button type="button" onClick={() => setShown((count) => count + 9)}>See more articles <span aria-hidden="true">&rarr;</span></button></div> : null}
  </section>;
}

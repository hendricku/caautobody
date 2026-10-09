"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useImportedBlogs } from "@/lib/useImportedBlogs";

export default function BlogIndexClient({ category }: { category?: "CA Knows" | "Client Stories" }) {
  const { items, imported } = useImportedBlogs();
  const [shown, setShown] = useState(9);
  const posts = items.filter((post) => post.status === "published" && (!category || post.category === category));

  useEffect(() => setShown(9), [category]);

  if (!posts.length) return imported ? <section className="shell section-pad"><p>No articles have been published yet.</p></section> : null;

  return <section className="shell blog-editorial-section section-pad">
    <div className="blog-grid">
      {posts.slice(0, shown).map((post) => <Link key={post.slug} href={`/blog/${post.slug}`}><img src={post.image} alt="" /><div><small>{post.category} <span aria-hidden="true">/</span> {post.date}</small><h3>{post.title}</h3><p>{post.excerpt}</p><b>Read more <span aria-hidden="true">&rarr;</span></b></div></Link>)}
    </div>
    <p className="sr-only" aria-live="polite">Showing {Math.min(shown, posts.length)} of {posts.length} articles.</p>
    {shown < posts.length ? <div className="blog-load-more"><button type="button" onClick={() => setShown((count) => count + 9)}>See more articles <span aria-hidden="true">&rarr;</span></button></div> : null}
  </section>;
}

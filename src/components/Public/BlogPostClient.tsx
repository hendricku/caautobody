"use client";

import Button from "@/components/UI/Button";
import Link from "next/link";
import { getBlogBlocks } from "@/lib/blogContent";
import { useImportedBlogs } from "@/lib/useImportedBlogs";
import type { BlogBlock, BlogContent } from "@/types/content";

function ArticleBlock({ block }: { block: BlogBlock }) {
  if (block.type === "heading") return <h2>{block.html ? <span dangerouslySetInnerHTML={{ __html: block.html }} /> : block.content}</h2>;
  if (block.type === "callout") return <blockquote>{block.html ? <span dangerouslySetInnerHTML={{ __html: block.html }} /> : block.content}</blockquote>;
  if (block.type === "image") return block.image ? <figure className="article-body__image"><img src={block.image} alt={block.alt} />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure> : null;
  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";
    return <List className="article-body__list">{block.items.map((item, index) => <li key={`${item.content}-${index}`}>{item.html ? <span dangerouslySetInnerHTML={{ __html: item.html }} /> : item.content}</li>)}</List>;
  }
  return block.html ? <p dangerouslySetInnerHTML={{ __html: block.html }} /> : <p>{block.content}</p>;
}

export default function BlogPostClient({ slug }: { slug: string }) {
  const { items, ready, imported } = useImportedBlogs();
  const article = items.find((post) => post.slug === slug);

  if (!article) return ready && imported ? <main className="article-page"><section className="shell section-pad"><h1>Article unavailable</h1><p>This article may no longer be published.</p></section></main> : null;

  const blocks = getBlogBlocks(article);
  const railImage = blocks.find((block): block is Extract<BlogBlock, { type: "image" }> => block.type === "image" && block.placement === "lead" && Boolean(block.image));
  const storyBlocks = blocks.filter((block) => block !== railImage);
  const related = items
    .filter((post) => post.status === "published" && post.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);

  return <main className="article-page">
    <section className="article-hero"><img src={article.image} alt="" /><div className="article-hero__shade" /><div className="article-hero__content"><span className="eyebrow light">{article.category} <span aria-hidden="true">/</span> {article.date}</span><h1>{article.title}</h1></div></section>
    <article className="article-body"><div className={`article-body__layout${railImage ? " has-rail" : ""}`}>{railImage ? <aside className="article-body__rail"><figure><img src={railImage.image} alt={railImage.alt} />{railImage.caption ? <figcaption>{railImage.caption}</figcaption> : null}</figure></aside> : null}<div className="article-body__content">{storyBlocks.map((block) => <ArticleBlock key={block.id} block={block} />)}<Button href="/contact" variant="black" arrow>Book an assessment</Button></div></div></article>
    <section className="article-related section-pad"><div className="shell"><div className="article-related__head"><div><span className="eyebrow">More from CA Autobody</span><h2>Keep reading.</h2></div><Link className="text-link" href="/blog">All articles <span aria-hidden="true">&rarr;</span></Link></div><div className="article-related__grid blog-grid">{related.map((post) => <Link key={post.slug} href={`/blog/${post.slug}`}><img src={post.image} alt="" /><div><small>{post.category} <span aria-hidden="true">/</span> {post.date}</small><h3>{post.title}</h3><p>{post.excerpt}</p><b>Read more <span aria-hidden="true">&rarr;</span></b></div></Link>)}</div></div></section>
  </main>;
}

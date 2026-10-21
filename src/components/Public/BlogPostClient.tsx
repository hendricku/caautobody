import Image from "next/image";
import Button from "@/components/UI/Button";
import Link from "next/link";
import { getBlogBlocks } from "@/lib/blogContent";
import { localBlogImageFor } from "@/lib/media";
import type { BlogBlock, BlogContent } from "@/types/content";

// Content in the database is user-editable. React text escaping is intentional:
// never render arbitrary CMS HTML as raw markup.
function ArticleBlock({ block }: { block: BlogBlock }) {
  if (block.type === "heading") return <h2>{block.content}</h2>;
  if (block.type === "callout") return <blockquote>{block.content}</blockquote>;
  if (block.type === "image") return block.image ? <figure className="article-body__image"><Image src={block.image} alt={block.alt}  width={1600} height={900} unoptimized />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure> : null;
  if (block.type === "list") { const List = block.ordered ? "ol" : "ul"; return <List className="article-body__list">{block.items.map((item, index) => <li key={`${block.id}-${index}`}>{item.content}</li>)}</List>; }
  return <p>{block.content}</p>;
}

export default function BlogPostClient({ article, posts }: { article: BlogContent; posts: BlogContent[] }) {
  const blocks = getBlogBlocks(article);
  const image = article.image || localBlogImageFor(article.slug);
  const railImage = blocks.find((block): block is Extract<BlogBlock, { type: "image" }> => block.type === "image" && block.placement === "lead" && Boolean(block.image));
  const storyBlocks = blocks.filter((block) => block !== railImage);
  const related = posts.filter((post) => post.status === "published" && post.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category)).slice(0, 3);
  return <main className="article-page">
    <section className="article-hero"><Image src={image} alt=""  width={1600} height={900} unoptimized /><div className="article-hero__shade" /><div className="article-hero__content"><span className="eyebrow light">{article.category} <span aria-hidden="true">/</span> {article.date}</span><h1>{article.title}</h1></div></section>
    <article className="article-body"><div className={`article-body__layout${railImage ? " has-rail" : ""}`}>{railImage ? <aside className="article-body__rail"><figure><Image src={railImage.image} alt={railImage.alt}  width={1600} height={900} unoptimized />{railImage.caption ? <figcaption>{railImage.caption}</figcaption> : null}</figure></aside> : null}<div className="article-body__content">{storyBlocks.map((block) => <ArticleBlock key={block.id} block={block} />)}<Button href="/contact" variant="black" arrow>Book an assessment</Button></div></div></article>
    <section className="article-related section-pad"><div className="shell"><div className="article-related__head"><div><span className="eyebrow">More from CA Autobody</span><h2>Keep reading.</h2></div><Link className="text-link" href="/blog">All articles <span aria-hidden="true">&rarr;</span></Link></div><div className="article-related__grid blog-grid">{related.map((post) => <Link key={post.slug} href={`/blog/${post.slug}`}><Image src={post.image || localBlogImageFor(post.slug)} alt=""  width={1600} height={900} unoptimized /><div><small>{post.category} <span aria-hidden="true">/</span> {post.date}</small><h3>{post.title}</h3><p>{post.excerpt}</p><b>Read more <span aria-hidden="true">&rarr;</span></b></div></Link>)}</div></div></section>
  </main>;
}

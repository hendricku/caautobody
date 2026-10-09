"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useImportedBlogs } from "@/lib/useImportedBlogs";
import { getBlogBlocks } from "@/lib/blogContent";
import type { BlogBlock, BlogContent } from "@/types/content";

const createBlock = (type: BlogBlock["type"]): BlogBlock =>
  type === "image"
    ? { id: `block-${Date.now()}`, type, image: "", alt: "", caption: "", placement: "full" }
    : type === "list"
      ? { id: `block-${Date.now()}`, type, ordered: false, items: [{ content: "List item" }] }
    : { id: `block-${Date.now()}`, type, content: type === "heading" ? "New heading" : type === "callout" ? "Supporting note" : "New paragraph" };

export default function AdminBlogEditor() {
  const params = useParams<{ slug: string }>();
  const { items, setItems, ready } = useImportedBlogs();
  const [dragged, setDragged] = useState<string | null>(null);
  const post = items.find((item) => item.slug === params.slug);

  if (!ready) return <p className="admin-loading">Loading article editor...</p>;
  if (!post) return <div className="admin-page-head"><div><span>Blogs</span><h1>Article unavailable</h1><p>This mock article could not be found in this browser.</p></div><Link className="admin-primary" href="/caautobodyadmin/blogs">Back to blogs</Link></div>;

  const blocks = getBlogBlocks(post);
  const saveBlocks = (next: BlogBlock[]) => setItems((current) => current.map((item) => item.slug === post.slug ? { ...item, origin: "local", blocks: next } : item));
  const update = (id: string, patch: Partial<BlogBlock>) => saveBlocks(blocks.map((block) => block.id === id ? { ...block, ...patch } as BlogBlock : block));
  const move = (id: string, direction: -1 | 1) => {
    const index = blocks.findIndex((block) => block.id === id);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    saveBlocks(next);
  };
  const drop = (targetId: string) => {
    if (!dragged || dragged === targetId) return setDragged(null);
    const next = [...blocks];
    const from = next.findIndex((block) => block.id === dragged);
    const to = next.findIndex((block) => block.id === targetId);
    const [block] = next.splice(from, 1);
    next.splice(to, 0, block);
    saveBlocks(next);
    setDragged(null);
  };

  return <>
    <div className="admin-page-head"><div><span>Article builder</span><h1>{post.title}</h1><p>Drag blocks to arrange the story. Move controls remain available for keyboard and mobile use.</p></div><Link className="admin-primary" href={`/blog/${post.slug}`} target="_blank">Preview article</Link></div>
    <div className="admin-builder">
      <section className="admin-blocks" aria-label="Article content blocks">
        {blocks.map((block, index) => <article className="admin-block" key={block.id} draggable onDragStart={() => setDragged(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(block.id)}>
          <div className="admin-block__bar"><span>Drag · {block.type}</span><div className="admin-block__actions"><button type="button" onClick={() => move(block.id, -1)} disabled={index === 0} aria-label="Move block up">↑</button><button type="button" onClick={() => move(block.id, 1)} disabled={index === blocks.length - 1} aria-label="Move block down">↓</button><button type="button" onClick={() => saveBlocks(blocks.filter((item) => item.id !== block.id))} aria-label="Delete block">×</button></div></div>
          {block.type === "image" ? <div className="admin-block__body"><label>Image placement<select value={block.placement || "full"} onChange={(event) => update(block.id, { placement: event.target.value as "lead" | "full" })}><option value="full">Full width in article body</option><option value="lead">Sticky left image in article body</option></select></label><label>Landscape image URL<input value={block.image} onChange={(event) => update(block.id, { image: event.target.value })} /></label><label>Alt text<input value={block.alt} onChange={(event) => update(block.id, { alt: event.target.value })} /></label><label>Caption <span>(optional)</span><input value={block.caption || ""} onChange={(event) => update(block.id, { caption: event.target.value })} /></label>{block.image ? <img className="admin-block__image-preview" src={block.image} alt={block.alt || "Preview"} /> : null}</div> : block.type === "list" ? <div className="admin-block__body"><label>List type<select value={block.ordered ? "ordered" : "unordered"} onChange={(event) => update(block.id, { ordered: event.target.value === "ordered" })}><option value="unordered">Bullet list</option><option value="ordered">Numbered list</option></select></label><label>List items <span>(one per line)</span><textarea rows={6} value={block.items.map((item) => item.content).join("\n")} onChange={(event) => update(block.id, { items: event.target.value.split("\n").map((content) => ({ content: content.trim() })).filter((item) => item.content) })} /></label></div> : <div className="admin-block__body"><label>{block.type === "heading" ? "Heading" : block.type === "callout" ? "Callout" : "Paragraph"}<textarea rows={block.type === "text" ? 6 : 3} value={block.content} onChange={(event) => update(block.id, { content: event.target.value, html: undefined })} /></label></div>}
        </article>)}
      </section>
      <aside className="admin-builder-tools"><span className="eyebrow">Add a block</span><h2>Build the article.</h2><p>Add content wherever it belongs, then drag it into the reading order.</p><div className="admin-builder-tools__buttons">{(["heading", "text", "list", "image", "callout"] as const).map((type) => <button type="button" key={type} onClick={() => saveBlocks([...blocks, createBlock(type)])}>+ {type}</button>)}</div></aside>
    </div>
  </>;
}

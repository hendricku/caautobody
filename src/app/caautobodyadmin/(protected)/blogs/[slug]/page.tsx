"use client";

import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import CmsImageField from "@/components/Admin/CmsImageField";
import { useCmsCollection } from "@/lib/cms/useCmsCollection";
import { isSafeCmsImageReference, normaliseCmsImageReference } from "@/lib/cms/image-reference";
import type { BlogBlock, BlogContent } from "@/types/content";

const createBlock = (type: BlogBlock["type"]): BlogBlock => {
  if (type === "image") {
    return { id: crypto.randomUUID(), type, image: "", alt: "", caption: "", placement: "full" };
  }

  if (type === "list") {
    return { id: crypto.randomUUID(), type, ordered: false, items: [{ content: "List item" }] };
  }

  return { id: crypto.randomUUID(), type, content: "" };
};

type ImageIssue = { blockId: string; index: number; message: string };

function findImageIssues(blocks: BlogBlock[]): ImageIssue[] {
  return blocks.flatMap((block, index) => {
    if (block.type !== "image") return [];
    const image = normaliseCmsImageReference(block.image);
    if (!image) return [{ blockId: block.id, index, message: `Block ${index + 1} needs an image.` }];
    if (!isSafeCmsImageReference(image)) return [{ blockId: block.id, index, message: `Block ${index + 1} has an older image reference that needs replacing.` }];
    return [];
  });
}

function SortableBlogBlock({
  block,
  index,
  issue,
  onUpdate,
  onDelete,
}: {
  block: BlogBlock;
  index: number;
  issue?: ImageIssue;
  onUpdate: (patch: Partial<BlogBlock>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <article id={`blog-block-${index + 1}`} ref={setNodeRef} style={style} className={`admin-block${isDragging ? " is-dragging" : ""}${issue ? " admin-block--issue" : ""}`}>
      <div className="admin-block__bar">
        <span>Block {index + 1} · {block.type}</span>
        <div className="admin-block__actions">
          <button
            className="admin-drag-handle"
            type="button"
            aria-label={`Reorder ${block.type} block`}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorRounded fontSize="small" />
          </button>
          <button type="button" onClick={onDelete} aria-label="Delete block">&times;</button>
        </div>
      </div>

      {block.type === "image" ? (
        <div className="admin-block__body">
          {issue ? <p className="admin-block__issue" role="alert"><strong>Image needs attention.</strong> {issue.message} Replace it below, or remove this block if it is no longer needed.</p> : null}
          <label>
            Image placement
            <select
              value={block.placement || "full"}
              onChange={(event) => onUpdate({ placement: event.target.value as "lead" | "full" })}
            >
              <option value="full">Full width</option>
              <option value="lead">Left rail</option>
            </select>
          </label>
          <CmsImageField id={`blog-block-image-${block.id}`} label="Article image" value={block.image} onChange={(image) => onUpdate({ image })} />
          <label>Alt text<input value={block.alt} onChange={(event) => onUpdate({ alt: event.target.value })} /></label>
          <label>Caption<input value={block.caption || ""} onChange={(event) => onUpdate({ caption: event.target.value })} /></label>
        </div>
      ) : null}

      {block.type === "list" ? (
        <div className="admin-block__body">
          <label>
            List type
            <select value={block.ordered ? "ordered" : "unordered"} onChange={(event) => onUpdate({ ordered: event.target.value === "ordered" })}>
              <option value="unordered">Bullet list</option>
              <option value="ordered">Numbered list</option>
            </select>
          </label>
          <label>
            Items (one per line)
            <textarea rows={6} value={block.items.map((item) => item.content).join("\n")} onChange={(event) => onUpdate({ items: event.target.value.split("\n").map((content) => ({ content })) })} />
          </label>
        </div>
      ) : null}

      {block.type !== "image" && block.type !== "list" ? (
        <div className="admin-block__body">
          <label>
            {block.type === "heading" ? "Heading" : block.type === "callout" ? "Callout" : "Paragraph"}
            <textarea rows={block.type === "text" ? 6 : 3} value={block.content} onChange={(event) => onUpdate({ content: event.target.value, html: undefined })} />
          </label>
        </div>
      ) : null}
    </article>
  );
}

export default function AdminBlogEditor() {
  const { slug } = useParams<{ slug: string }>();
  const { items, ready, error, save } = useCmsCollection<BlogContent>("blogs");
  const post = items.find((item) => item.slug === slug);
  const [blocks, setBlocks] = useState<BlogBlock[]>([]);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const imageIssues = findImageIssues(blocks);

  useEffect(() => {
    if (post && !dirty) {
      setBlocks(post.blocks?.length ? post.blocks : [{ id: "intro", type: "text", content: post.excerpt }]);
      setTitle(post.title);
    }
  }, [post, dirty]);

  const editBlocks = (next: BlogBlock[]) => {
    setBlocks(next);
    setDirty(true);
  };

  const update = (id: string, patch: Partial<BlogBlock>) => {
    editBlocks(blocks.map((block) => (block.id === id ? { ...block, ...patch } as BlogBlock : block)));
  };

  const updateTitle = (nextTitle: string) => {
    setTitle(nextTitle);
    setDirty(true);
  };

  async function deleteBlock(id: string) {
    const confirmation = await Swal.fire({ icon: "warning", title: "Remove this content block?", text: "The block will be removed when the article is saved.", showCancelButton: true, confirmButtonText: "Remove block", confirmButtonColor: "#9d3c36", focusCancel: true });
    if (!confirmation.isConfirmed) return;
    editBlocks(blocks.filter((item) => item.id !== id));
    void Swal.fire({ icon: "success", title: "Block removed", timer: 1300, showConfirmButton: false });
  }

  const reorder = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((block) => block.id === active.id);
    const to = blocks.findIndex((block) => block.id === over.id);
    if (from >= 0 && to >= 0) editBlocks(arrayMove(blocks, from, to));
  };

  async function submit() {
    if (!post || busy) return;
    if (!title.trim()) {
      void Swal.fire({ icon: "error", text: "Add an article title before saving." });
      return;
    }
    if (imageIssues.length) {
      const first = imageIssues[0];
      document.getElementById("blog-block-" + (first.index + 1))?.scrollIntoView({ behavior: "smooth", block: "center" });
      void Swal.fire({ icon: "warning", title: "One image needs attention", text: `${first.message} The editor has taken you to it.` });
      return;
    }
    setBusy(true);
    try {
      await save({ ...post, title: title.trim(), blocks }, post.slug);
      setDirty(false);
      setEditingTitle(false);
      void Swal.fire({ icon: "success", title: "Article saved", timer: 1700, showConfirmButton: false });
    } catch (err) {
      void Swal.fire({ icon: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <p className="admin-loading">Loading article from Supabase...</p>;

  if (!post) {
    return (
      <div className="admin-page-head">
        <div><span>Blogs</span><h1>Article unavailable</h1><p>{error || "This article is not in the authorized CMS."}</p></div>
        <Link className="admin-primary" href="/caautobodyadmin/blogs">Back to blogs</Link>
      </div>
    );
  }

  return (
    <>
      <div className="admin-page-head admin-page-head--editor">
        <div><span>Article builder</span><div className="admin-editable-title">{editingTitle ? <input aria-label="Article title" value={title} onChange={(event) => updateTitle(event.target.value)} autoFocus /> : <h1>{title || post.title}</h1>}<button className="admin-title-edit" type="button" onClick={() => setEditingTitle((current) => !current)} aria-label={editingTitle ? "Finish editing title" : "Edit article title"} title={editingTitle ? "Finish editing title" : "Edit article title"}><EditOutlined fontSize="small" /></button></div><p>Use the grip handle to arrange blocks, then save. Handles work with mouse, touch and keyboard.</p></div>
          <Link href={`/blog/${post.slug}`} target="_blank">View published article -&gt;</Link>
        <div className="admin-editor-actions">
          <p aria-live="polite">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <div role="group" aria-label="Article actions">
            <button className="admin-primary" type="button" onClick={() => void submit()} disabled={busy || !dirty}>{busy ? "Saving..." : "Save article"}</button>
            <Link href={`/blog/${post.slug}`} target="_blank">View published article -&gt;</Link>
          </div>
        </div>
      </div>
      {!post.blocks?.length ? <p className="admin-note">This migrated record has no complete article body yet. Import the approved original content before publishing. Existing text is not invented or replaced.</p> : null}
      {error ? <p className="admin-note" role="alert">CMS error: {error}</p> : null}
      {imageIssues.length ? <section className="admin-editor-issues" aria-labelledby="article-image-issues">
        <div><span>Before saving</span><h2 id="article-image-issues">{imageIssues.length} image {imageIssues.length === 1 ? "needs" : "need"} attention</h2><p>An older image reference is stopping this article from saving. Replace or remove the listed block.</p></div>
        <div>{imageIssues.map((issue) => <button key={issue.blockId} type="button" onClick={() => document.getElementById("blog-block-" + (issue.index + 1))?.scrollIntoView({ behavior: "smooth", block: "center" })}>Review block {issue.index + 1}</button>)}</div>
      </section> : null}
      <div className="admin-builder">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
          <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
            <section className="admin-blocks" aria-label="Article content blocks">
              {blocks.map((block, index) => <SortableBlogBlock key={block.id} block={block} index={index} issue={imageIssues.find((issue) => issue.blockId === block.id)} onUpdate={(patch) => update(block.id, patch)} onDelete={() => void deleteBlock(block.id)} />)}
            </section>
          </SortableContext>
        </DndContext>
        <aside className="admin-builder-tools">
          <span className="eyebrow">Add a block</span>
          <h2>Build the article.</h2>
          <p>Changes are saved only when you click Save article blocks.</p>
          <div className="admin-builder-tools__buttons">
            {(["heading", "text", "list", "image", "callout"] as const).map((type) => <button type="button" key={type} onClick={() => editBlocks([...blocks, createBlock(type)])}>+ {type}</button>)}
          </div>
        </aside>
      </div>
    </>
  );
}

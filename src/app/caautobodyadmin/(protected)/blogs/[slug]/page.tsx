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
import type { BlogBlock, BlogContent, ContentStatus } from "@/types/content";

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
  readOnly,
  onUpdate,
  onDelete,
}: {
  block: BlogBlock;
  index: number;
  issue?: ImageIssue;
  readOnly: boolean;
  onUpdate: (patch: Partial<BlogBlock>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: readOnly });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <article id={`blog-block-${index + 1}`} ref={setNodeRef} style={style} className={`admin-block${isDragging ? " is-dragging" : ""}${issue ? " admin-block--issue" : ""}`}>
      <div className="admin-block__bar">
        <span>Block {index + 1} · {block.type}</span>
        <div className="admin-block__actions">
          <button
            className="admin-drag-handle"
            type="button"
            disabled={readOnly}
            aria-label={`Reorder ${block.type} block`}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorRounded fontSize="small" />
          </button>
          <button type="button" disabled={readOnly} onClick={onDelete} aria-label="Delete block">&times;</button>
        </div>
      </div>

      {block.type === "image" ? (
        <div className="admin-block__body">
          {issue ? <p className="admin-block__issue" role="alert"><strong>Image needs attention.</strong> {issue.message} Replace it below, or remove this block if it is no longer needed.</p> : null}
          <label>
            Image placement
            <select
              value={block.placement || "full"}
              disabled={readOnly}
              onChange={(event) => onUpdate({ placement: event.target.value as "lead" | "full" })}
            >
              <option value="full">Wide article image (landscape)</option>
              <option value="lead">Side image (portrait crop)</option>
            </select>
          </label>
          <p className="admin-field-help">Choose <strong>Wide article image</strong> for most landscape workshop photos. Use <strong>Side image</strong> only when you want a supporting portrait crop beside the article copy.</p>
          <CmsImageField id={`blog-block-image-${block.id}`} label="Article image" purpose="content" value={block.image} disabled={readOnly} onChange={(image) => onUpdate({ image })} />
          <label>Alt text<input disabled={readOnly} value={block.alt} onChange={(event) => onUpdate({ alt: event.target.value })} /></label>
          <label>Caption<input disabled={readOnly} value={block.caption || ""} onChange={(event) => onUpdate({ caption: event.target.value })} /></label>
        </div>
      ) : null}

      {block.type === "list" ? (
        <div className="admin-block__body">
          <label>
            List type
            <select disabled={readOnly} value={block.ordered ? "ordered" : "unordered"} onChange={(event) => onUpdate({ ordered: event.target.value === "ordered" })}>
              <option value="unordered">Bullet list</option>
              <option value="ordered">Numbered list</option>
            </select>
          </label>
          <label>
            Items (one per line)
            <textarea disabled={readOnly} rows={6} value={block.items.map((item) => item.content).join("\n")} onChange={(event) => onUpdate({ items: event.target.value.split("\n").map((content) => ({ content })) })} />
          </label>
        </div>
      ) : null}

      {block.type !== "image" && block.type !== "list" ? (
        <div className="admin-block__body">
          <label>
            {block.type === "heading" ? "Heading" : block.type === "callout" ? "Callout" : "Paragraph"}
            <textarea disabled={readOnly} rows={block.type === "text" ? 6 : 3} value={block.content} onChange={(event) => onUpdate({ content: event.target.value, html: undefined })} />
          </label>
        </div>
      ) : null}
    </article>
  );
}

export default function AdminBlogEditor() {
  const { slug } = useParams<{ slug: string }>();
  const { items, ready, error, role, save } = useCmsCollection<BlogContent>("blogs");
  const post = items.find((item) => item.slug === slug);
  const [blocks, setBlocks] = useState<BlogBlock[]>([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [editingTitle, setEditingTitle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const imageIssues = findImageIssues(blocks);
  const canEdit = post ? role !== "editor" || post.status === "draft" : false;

  useEffect(() => {
    if (post && !dirty) {
      setBlocks(post.blocks?.length ? post.blocks : [{ id: "intro", type: "text", content: post.excerpt }]);
      setTitle(post.title);
      setStatus(post.status);
    }
  }, [post, dirty]);

  const editBlocks = (next: BlogBlock[]) => {
    if (!canEdit) return;
    setBlocks(next);
    setDirty(true);
  };

  const update = (id: string, patch: Partial<BlogBlock>) => {
    editBlocks(blocks.map((block) => (block.id === id ? { ...block, ...patch } as BlogBlock : block)));
  };

  const updateTitle = (nextTitle: string) => {
    if (!canEdit) return;
    setTitle(nextTitle);
    setDirty(true);
  };

  async function deleteBlock(id: string) {
    if (!canEdit) return;
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

  async function submit(nextStatus: ContentStatus) {
    if (!post || busy) return;
    if (!canEdit) {
      void Swal.fire({ icon: "info", text: "Editors can only modify draft articles. Duplicate this article to make an editable draft." });
      return;
    }
    if (nextStatus === "published" && role === "editor") {
      void Swal.fire({ icon: "info", text: "Publishing requires Publisher or Admin permissions." });
      return;
    }
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
      await save({ ...post, title: title.trim(), blocks, status: nextStatus }, post.slug);
      setDirty(false);
      setEditingTitle(false);
      setStatus(nextStatus);
      void Swal.fire({ icon: "success", title: nextStatus === "published" ? "Article published" : "Draft saved", timer: 1700, showConfirmButton: false });
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
        <div><span>Article builder</span><div className="admin-editable-title">{editingTitle ? <input aria-label="Article title" value={title} onChange={(event) => updateTitle(event.target.value)} autoFocus /> : <h1>{title || post.title}</h1>}<button className="admin-title-edit" type="button" disabled={!canEdit} onClick={() => setEditingTitle((current) => !current)} aria-label={editingTitle ? "Finish editing title" : "Edit article title"} title={editingTitle ? "Finish editing title" : "Edit article title"}><EditOutlined fontSize="small" /></button></div><p>{canEdit ? "Use the grip handle to arrange blocks, then save. Handles work with mouse, touch and keyboard." : "This published article is read-only for Editors. Duplicate it to create an editable draft."}</p></div>
        <div className="admin-editor-actions">
          <p aria-live="polite"><span className={`admin-editor-status is-${status}`}>{status}</span>{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <div role="group" aria-label="Article actions">
            <Link href={`/caautobodyadmin/blogs/${post.slug}/preview`} target="_blank" rel="noopener noreferrer">Preview</Link>
            {status === "draft" ? <button className="admin-editor-secondary" type="button" onClick={() => void submit("draft")} disabled={busy || !canEdit || !dirty}>{busy ? "Saving..." : "Save draft"}</button> : <button className="admin-editor-secondary" type="button" onClick={() => void submit("published")} disabled={busy || !canEdit || !dirty}>{busy ? "Saving..." : "Save changes"}</button>}
            {role !== "editor" && status === "draft" ? <button className="admin-primary" type="button" onClick={() => void submit("published")} disabled={busy || !canEdit}>{busy ? "Publishing..." : "Publish article"}</button> : null}
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
              {blocks.map((block, index) => <SortableBlogBlock key={block.id} block={block} index={index} issue={imageIssues.find((issue) => issue.blockId === block.id)} readOnly={!canEdit} onUpdate={(patch) => update(block.id, patch)} onDelete={() => void deleteBlock(block.id)} />)}
            </section>
          </SortableContext>
        </DndContext>
        <aside className="admin-builder-tools">
          <span className="eyebrow">Add a block</span>
          <h2>Build the article.</h2>
          <p>Changes are saved only when you click Save article blocks.</p>
          <div className="admin-builder-tools__buttons">
            {(["heading", "text", "list", "image", "callout"] as const).map((type) => <button type="button" key={type} disabled={!canEdit} onClick={() => editBlocks([...blocks, createBlock(type)])}>+ {type}</button>)}
          </div>
        </aside>
      </div>
    </>
  );
}

export type DuplicateCollection = "blogs" | "services" | "faqs" | "gallery" | "offers" | "areas";

type ContentRecord = Record<string, unknown>;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function copyTitle(value: unknown, maxLength = 300) {
  const original = typeof value === "string" ? value.trim() : "";
  const suffix = " (Copy)";
  return `${original.slice(0, Math.max(0, maxLength - suffix.length))}${suffix}`;
}

export function copySlug(originalSlug: string, attempt = 0) {
  const suffix = attempt === 0 ? "-copy" : `-copy-${attempt + 1}`;
  return `${originalSlug.slice(0, Math.max(1, 120 - suffix.length))}${suffix}`;
}

export function freshLegacyKey(collection: DuplicateCollection) {
  const prefix = collection === "faqs" ? "faq" : collection === "gallery" ? "gallery" : collection;
  return `${prefix}-${crypto.randomUUID()}`;
}

export function duplicateInput(
  collection: DuplicateCollection,
  source: ContentRecord,
  slug?: string,
): ContentRecord {
  const copy = cloneJson(source);

  copy.status = "draft";

  if (collection === "blogs") {
    copy.slug = slug;
    copy.title = copyTitle(source.title);
    copy.blocks = Array.isArray(copy.blocks)
      ? copy.blocks.map((block) => block && typeof block === "object" && !Array.isArray(block)
        ? { ...(block as ContentRecord), id: crypto.randomUUID() }
        : block)
      : [];
    return copy;
  }

  if (collection === "services" || collection === "offers") {
    copy.slug = slug;
    copy.title = copyTitle(source.title);
    return copy;
  }

  if (collection === "areas") {
    copy.slug = slug;
    copy.name = copyTitle(source.name);
    return copy;
  }

  copy.id = freshLegacyKey(collection);
  if (collection === "faqs") copy.question = copyTitle(source.question, 500);
  if (collection === "gallery") copy.caption = copyTitle(source.caption, 500);
  return copy;
}

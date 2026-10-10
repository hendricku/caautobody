import type { BlogBlock, BlogContent } from "@/types/content";
import { localBlogImageFor } from "@/lib/media";

const WORDPRESS_POSTS_URL = "https://caautobody.com.au/wp-json/wp/v2/posts?per_page=100&_embed";

type WordPressPost = {
  slug: string;
  date: string;
  status: "publish" | string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      alt_text?: string;
      title?: { rendered?: string };
    }>;
    "wp:term"?: Array<Array<{ name?: string }>>;
  };
};

const entityMap: Record<string, string> = {
  "&#8217;": "'", "&#8216;": "'", "&#8220;": "\"", "&#8221;": "\"", "&#8211;": "–", "&#8212;": "—", "&amp;": "&", "&nbsp;": " ", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&hellip;": "…", "&#038;": "&",
};

function decodeEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&(amp|nbsp|quot|lt|gt|hellip);/gi, (match) => entityMap[match.toLowerCase()] || match)
    .replace(/&#8217;|&#8216;|&#8220;|&#8221;|&#8211;|&#8212;|&#038;/g, (match) => entityMap[match] || match);
}

function decodeHtml(value: string) {
  return decodeEntities(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function attributeValue(attributes: string, name: string) {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decodeEntities(match?.[1] || match?.[2] || match?.[3] || "").trim();
}

function safeHref(value: string) {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#") || /^(mailto:|tel:)/i.test(value)) return value;
  try {
    const url = new URL(value);
    return /^(https?):$/.test(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitiseInlineHtml(value: string) {
  const withSafeLinks = value
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<a\b([^>]*)>/gi, (_, attributes) => {
      const href = safeHref(attributeValue(attributes, "href"));
      return href ? `<a href="${escapeAttribute(href)}">` : "<a>";
    })
    .replace(/<\/(?:a|strong|b|em|i)>/gi, (tag) => tag.toLowerCase() === "</b>" ? "</strong>" : tag.toLowerCase() === "</i>" ? "</em>" : tag.toLowerCase())
    .replace(/<(?:strong|b)\b[^>]*>/gi, "<strong>")
    .replace(/<(?:em|i)\b[^>]*>/gi, "<em>")
    .replace(/<br\s*\/?\s*>/gi, "<br />")
    .replace(/<(?!\/?(?:a|strong|em)\b|br\s*\/?>)[^>]*>/gi, "");

  return decodeEntities(withSafeLinks).replace(/\s+/g, " ").trim();
}

function richText(content: string) {
  const html = sanitiseInlineHtml(content);
  const text = decodeHtml(html);
  return html && html !== text ? { content: text, html } : { content: text };
}

function imageBlock(markup: string, id: string, image: string, placement: "lead" | "full" = "full"): Extract<BlogBlock, { type: "image" }> | null {
  const match = markup.match(/<img\b([^>]*)>/i);
  if (!match) return null;
  const alt = attributeValue(match[1], "alt") || "CA Autobody repair work";
  const captionMatch = markup.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
  const caption = captionMatch ? decodeHtml(captionMatch[1]) : undefined;
  return { id, type: "image", image, alt, caption, placement };
}

function listBlock(markup: string, id: string, ordered: boolean): Extract<BlogBlock, { type: "list" }> | null {
  const items = Array.from(markup.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => richText(match[1]))
    .filter((item) => item.content);
  return items.length ? { id, type: "list", ordered, items } : null;
}

function blocksFromWordPress(html: string, localImage: string): BlogBlock[] {
  const captured: BlogBlock[] = [];
  let index = 0;
  const id = () => `import-${index++}`;
  const capture = (block: BlogBlock) => {
    const marker = `[[blog-block-${captured.length}]]`;
    captured.push(block);
    return `\n\n${marker}\n\n`;
  };

  const remaining = html
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, (markup) => {
      const block = imageBlock(markup, id(), localImage);
      return block ? capture(block) : "";
    })
    .replace(/<(ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi, (markup, tag) => {
      const block = listBlock(markup, id(), tag.toLowerCase() === "ol");
      return block ? capture(block) : "";
    })
    .replace(/<h([2-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, __, content) => {
      const text = richText(content);
      return text.content ? capture({ id: id(), type: "heading", ...text }) : "";
    })
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, content) => {
      const onlyImage = content.match(/^\s*(?:<a\b[^>]*>)?\s*(<img\b[^>]*>)\s*(?:<\/a>)?\s*$/i);
      const image = onlyImage ? imageBlock(onlyImage[1], id(), localImage) : null;
      if (image) return capture(image);
      const text = richText(content);
      return text.content ? capture({ id: id(), type: "text", ...text }) : "";
    })
    .replace(/<img\b[^>]*>/gi, (markup) => {
      const block = imageBlock(markup, id(), localImage);
      return block ? capture(block) : "";
    });

  const chunks = remaining
    .split(/(?:\r?\n){2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const blocks: BlogBlock[] = [];
  chunks.forEach((chunk) => {
    const marker = chunk.match(/^\[\[blog-block-(\d+)\]\]$/);
    if (marker) {
      blocks.push(captured[Number(marker[1])]);
      return;
    }
    const text = richText(chunk);
    if (text.content) blocks.push({ id: id(), type: "text", ...text });
  });

  return blocks;
}

function displayDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Melbourne" }).format(new Date(date));
}

function sourceImage(post: WordPressPost) {
  return localBlogImageFor(post.slug);
}

export function wordPressPostToBlog(post: WordPressPost): BlogContent {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const image = sourceImage(post);

  return {
    slug: post.slug,
    title: decodeHtml(post.title.rendered),
    date: displayDate(post.date),
    category: "CA Knows",
    excerpt: decodeHtml(post.excerpt.rendered),
    image,
    status: post.status === "publish" ? "published" : "draft",
    origin: "live",
    blocks: [
      {
        id: "lead-image",
        type: "image",
        image,
        alt: decodeHtml(media?.alt_text || media?.title?.rendered || post.title.rendered),
        placement: "lead",
      },
      ...blocksFromWordPress(post.content.rendered, image),
    ],
  };
}

export async function fetchLiveBlogs(): Promise<BlogContent[]> {
  const response = await fetch(WORDPRESS_POSTS_URL, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`Unable to import live blogs (${response.status})`);
  const posts = await response.json() as WordPressPost[];
  return posts.map(wordPressPostToBlog);
}

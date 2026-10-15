export type ContentStatus = "published" | "draft";
export type BlogCategory = "CA Knows" | "Client Stories";

export interface ServiceContent {
  status?: "draft" | "published" | "retired";
  slug: string;
  title: string;
  seoTitle: string;
  eyebrow: string;
  intro: string;
  body: string[];
  image: string;
  highlights: string[];
  contentPending?: boolean;
}

export interface LocationContent {
  status?: "draft" | "published" | "retired";
  slug: string;
  name: string;
  seoTitle: string;
  intro: string;
  body: string[];
  image: string;
  coordinates: [number, number];
  mapDescription: string;
}

export interface OfferContent {
  status?: "draft" | "published" | "retired";
  slug: string;
  title: string;
  seoTitle: string;
  eyebrow: string;
  intro: string;
  body: string[];
  image: string;
  bullets: string[];
}

export interface BlogContent {
  slug: string;
  title: string;
  date: string;
  category: BlogCategory;
  excerpt: string;
  image: string;
  status: ContentStatus;
  origin?: "live" | "local";
  blocks?: BlogBlock[];
}

export type BlogBlock =
  | { id: string; type: "heading" | "text" | "callout"; content: string; html?: string }
  | { id: string; type: "list"; ordered: boolean; items: Array<{ content: string; html?: string }> }
  | { id: string; type: "image"; image: string; alt: string; caption?: string; placement?: "lead" | "full" };

export interface FAQContent {
  status?: "draft" | "published" | "retired";
  id: string;
  category: string;
  question: string;
  answer: string;
  visible: boolean;
}

export interface GalleryContent {
  status?: "draft" | "published" | "retired";
  id: string;
  image: string;
  caption: string;
  category: string;
}

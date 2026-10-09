"use client";

import { useEffect, useState } from "react";
import { useLocalCollection } from "@/lib/adminStore";
import { blogs as seedBlogs } from "@/lib/siteContent";
import type { BlogContent } from "@/types/content";

function isLegacyDefaultArticle(post: BlogContent) {
  const ids = new Set(post.blocks?.map((block) => block.id));
  return ids.has("lead-image") && ids.has("facts") && ids.has("communication");
}

function mergeLiveBlogs(current: BlogContent[], incoming: BlogContent[]) {
  const existing = new Map(current.map((post) => [post.slug, post]));
  const imported = incoming.map((post) => {
    const local = existing.get(post.slug);
    // Only explicit dashboard edits override the refreshed WordPress source.
    // Entries saved before the source marker existed are treated as local edits too.
    const legacyDefault = local ? isLegacyDefaultArticle(local) : false;
    const isLocalOverride = local?.origin === "local" || (!local?.origin && Boolean(local?.blocks?.length) && !legacyDefault);
    return isLocalOverride ? { ...post, ...local, origin: "local" as const } : post;
  });
  const customOnly = current.filter((post) => !incoming.some((item) => item.slug === post.slug) && (post.origin === "local" || (!post.origin && Boolean(post.blocks?.length) && !isLegacyDefaultArticle(post))));
  return [...imported, ...customOnly];
}

export function useImportedBlogs() {
  const collection = useLocalCollection<BlogContent>("ca-admin-blogs", seedBlogs);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    if (!collection.ready) return;
    let active = true;
    fetch("/api/blogs")
      .then((response) => response.ok ? response.json() as Promise<BlogContent[]> : Promise.reject(new Error("Import unavailable")))
      .then((incoming) => {
        if (active) collection.setItems((current) => mergeLiveBlogs(current, incoming));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setImported(true); });
    return () => { active = false; };
  }, [collection.ready, collection.setItems]);

  return { ...collection, imported };
}

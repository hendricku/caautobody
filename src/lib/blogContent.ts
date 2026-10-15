import type { BlogBlock, BlogContent } from "@/types/content";
import { media } from "@/lib/media";

export function defaultBlogBlocks(post: BlogContent): BlogBlock[] {
  return [
    { id: "intro", type: "text", content: post.excerpt },
    { id: "lead-image", type: "image", image: media.workshop.assessment, alt: "Vehicle receiving repair work at the CA Autobody workshop", caption: "Repair work is planned around the vehicle, damage and practical claim details.", placement: "lead" },
    { id: "facts", type: "heading", content: "Start with the repair facts." },
    { id: "facts-copy", type: "text", content: "Before a repair decision is made, the vehicle, the damage and the practical claim details need to be understood clearly. That gives the workshop a better foundation for planning the next steps." },
    { id: "communication", type: "heading", content: "Clear communication matters." },
    { id: "communication-copy", type: "text", content: "Customers should know what stage the vehicle is at, what is waiting for approval or parts, and what the expected next step is. A good repair experience is easier when those details are communicated without unnecessary jargon." },
    { id: "workshop-image", type: "image", image: media.workshop.paintMixing, alt: "Vehicle refinishing work inside the CA Autobody workshop", caption: "Careful preparation and controlled refinishing form part of a considered repair process.", placement: "full" },
  ];
}

export function getBlogBlocks(post: BlogContent): BlogBlock[] {
  return post.blocks?.length ? post.blocks : [{ id: "summary", type: "text", content: post.excerpt }];
}

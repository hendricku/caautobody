import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/cms/service-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = serviceClient();
    const { data: state, error: stateError } = await database.from("cms_publication_state").select("updated_at").eq("id", true).maybeSingle();
    if (!stateError && state?.updated_at) return versionResponse(state.updated_at);

    // This fallback makes existing installations update automatically even
    // before the new publication-state migration is applied. It returns only
    // a timestamp, never row data, drafts or customer information.
    const tables = ["cms_services", "cms_locations", "cms_offers", "cms_blog_posts", "cms_faqs", "cms_gallery_items", "cms_page_sections", "cms_site_settings"];
    const results = await Promise.all(tables.map((table) => database.from(table).select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle()));
    const timestamps = results.flatMap((result) => result.data?.updated_at ? [result.data.updated_at] : []);
    return versionResponse(timestamps.sort().at(-1) || "0");
  } catch {
    return versionResponse("0");
  }
}

function versionResponse(version: string) {
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

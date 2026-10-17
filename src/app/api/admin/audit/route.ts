import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/cms/admin-server";

const tables = new Set([
  "cms_blog_posts",
  "cms_services",
  "cms_locations",
  "cms_offers",
  "cms_faqs",
  "cms_gallery_items",
  "cms_page_sections",
  "cms_site_settings",
  "cms_enquiries",
  "cms_admin_members",
  "analytics_exports",
]);
const operations = new Set(["INSERT", "UPDATE", "DELETE", "DEACTIVATE", "REACTIVATE", "EXPORT", "LEGACY"]);

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Admin role required" }, { status: 403 });

  const table = request.nextUrl.searchParams.get("table") || "";
  const operation = request.nextUrl.searchParams.get("operation") || "";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || "50");
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
  const before = request.nextUrl.searchParams.get("before") || "";

  let query = admin.client
    .from("cms_audit_log")
    .select("id,actor_id,actor_email,table_name,record_id,operation,old_status,new_status,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (tables.has(table)) query = query.eq("table_name", table);
  if (operations.has(operation)) query = query.eq("operation", operation);
  if (before && !Number.isNaN(Date.parse(before))) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) {
    console.error("CMS audit read failure", { code: error.code });
    return NextResponse.json({ error: "Audit history is temporarily unavailable." }, { status: 503 });
  }

  return NextResponse.json({ items: data || [] }, { headers: { "Cache-Control": "no-store" } });
}

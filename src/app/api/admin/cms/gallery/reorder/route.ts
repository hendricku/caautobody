import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";

const reorderSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1).max(140)).min(1).max(500),
}).strict();

/** Order-only write. Uses the existing cms_gallery_items.sort_order column.
 * No content, publication status, or image fields are changed.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin" && admin.role !== "publisher") {
    return NextResponse.json({ error: "Publisher or Admin permission is required to reorder the public gallery" }, { status: 403 });
  }

  const parsed = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || new Set(parsed.data.orderedIds).size !== parsed.data.orderedIds.length) {
    return NextResponse.json({ error: "Invalid gallery order" }, { status: 400 });
  }
  const { data: rows, error: readError } = await admin.client.from("cms_gallery_items")
    .select("id,legacy_key,status,sort_order")
    .neq("status", "retired").order("sort_order", { ascending: true }).order("id", { ascending: true }).limit(501);
  if (readError) return NextResponse.json({ error: "Gallery order could not be loaded" }, { status: 503 });
  if (!rows || rows.length > 500 || rows.length !== parsed.data.orderedIds.length) {
    return NextResponse.json({ error: "Gallery changed. Refresh before saving the order." }, { status: 409 });
  }
  const current = new Map(rows.map((row) => [row.legacy_key, row]));
  if (parsed.data.orderedIds.some((id) => !current.has(id))) {
    return NextResponse.json({ error: "Gallery changed. Refresh before saving the order." }, { status: 409 });
  }

  // Prefer a single atomic PostgreSQL write if the staging-approved RPC is
  // installed. Older deployments retain the legacy best-effort path below.
  const atomic = await admin.client.rpc("cms_reorder_gallery", { p_ordered_ids: parsed.data.orderedIds });
  if (!atomic.error) {
    revalidatePath("/gallery");
    return NextResponse.json({ ok: true, count: atomic.data, atomic: true });
  }
  // PostgREST's function-not-found code permits a staged rollout without
  // breaking galleries on installations that have not applied the migration.
  if (!["PGRST202", "42883"].includes(atomic.error.code)) {
    console.error("Atomic CMS gallery reorder failed", { code: atomic.error.code });
    return NextResponse.json({ error: "Gallery order was not saved. Reload and retry." }, { status: atomic.error.code === "40001" ? 409 : 503 });
  }

  const changed = parsed.data.orderedIds.map((id, index) => ({ row: current.get(id)!, next: (index + 1) * 10 }))
    .filter(({ row, next }) => row.sort_order !== next);
  // Make best-effort rollback if a write fails. This does not claim a DB transaction.
  const updated: typeof changed = [];
  for (const entry of changed) {
    const { data: saved, error } = await admin.client.from("cms_gallery_items")
      .update({ sort_order: entry.next }).eq("id", entry.row.id).eq("sort_order", entry.row.sort_order).select("id");
    if (error || !saved || saved.length !== 1) {
      for (const previous of updated.reverse()) {
        await admin.client.from("cms_gallery_items").update({ sort_order: previous.row.sort_order }).eq("id", previous.row.id).eq("sort_order", previous.next);
      }
      return NextResponse.json({ error: "Unable to save gallery order. Refresh to confirm the current order." }, { status: 503 });
    }
    updated.push(entry);
  }
  revalidatePath("/gallery");
  return NextResponse.json({ ok: true, count: changed.length });
}

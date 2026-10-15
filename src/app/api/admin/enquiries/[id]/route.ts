import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";

const updateSchema = z.object({ status: z.enum(["new", "in-progress", "resolved", "archived"]) }).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const id = (await params).id;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid enquiry" }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid enquiry update" }, { status: 400 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role === "editor") return NextResponse.json({ error: "Publisher or Admin role required" }, { status: 403 });
  const { error } = await admin.client.from("cms_enquiries").update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Unable to update enquiry" }, { status: 503 });
  return NextResponse.json({ ok: true });
}

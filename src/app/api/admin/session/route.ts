import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/cms/admin-server";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ email: admin.user.email || "CMS user", role: admin.role }, { headers: { "Cache-Control": "no-store" } });
}

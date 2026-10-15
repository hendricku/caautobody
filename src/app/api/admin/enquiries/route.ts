import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/cms/admin-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role === "editor") return NextResponse.json({ error: "Publisher or Admin role required" }, { status: 403 });
  const { data, error } = await admin.client
    .from("cms_enquiries")
    .select("id,enquiry_type,brand,full_name,phone,email,suburb,service,vehicle,claim_status,message,attachment_names,status,delivery_status,created_at")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) return NextResponse.json({ error: "Enquiries are currently unavailable" }, { status: 503 });
  const items = (data || []).map((row) => ({
    id: row.id, name: row.full_name, phone: row.phone, email: row.email, suburb: row.suburb, service: row.service, message: row.message,
    status: row.status, createdAt: row.created_at, brand: row.brand || undefined, vehicle: row.vehicle || undefined, claimStatus: row.claim_status || undefined,
    attachments: Array.isArray(row.attachment_names) ? row.attachment_names.filter((name): name is string => typeof name === "string") : [],
    enquiryType: row.enquiry_type, deliveryStatus: row.delivery_status,
  }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

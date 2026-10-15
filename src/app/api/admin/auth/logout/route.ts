import { NextRequest, NextResponse } from "next/server";
import { clearLegacyAdminCookies, createAdminRouteClient, sameOrigin } from "@/lib/cms/admin-server";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  await createAdminRouteClient(request, response).auth.signOut({ scope: "local" });
  clearLegacyAdminCookies(response);
  return response;
}

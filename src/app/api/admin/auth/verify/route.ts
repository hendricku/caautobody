import { NextRequest, NextResponse } from "next/server";
import { createAdminRouteClient, sameOrigin, supabaseForToken } from "@/lib/cms/admin-server";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { email, code } = await request.json().catch(() => ({ email: "", code: "" }));
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof code !== "string" || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the six-digit code from your email" }, { status: 400 });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumePublicRateLimit({ request, scope: "admin-otp-verify-ip", limit: 10, windowSeconds: 15 * 60 }),
      consumePublicRateLimit({ request, scope: "admin-otp-verify-email", identity: normalizedEmail, limit: 6, windowSeconds: 15 * 60 }),
    ]);
    if (!ipAllowed || !emailAllowed) return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    const anonymous = createAdminRouteClient(request, response);
    const { data, error } = await anonymous.auth.verifyOtp({ email: normalizedEmail, token: code, type: "email" });
    if (error || !data.session || !data.user) return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    const authorized = supabaseForToken(data.session.access_token);
    const { data: member } = await authorized.from("cms_admin_members").select("role").eq("user_id", data.user.id).eq("active", true).maybeSingle();
    if (!member) return NextResponse.json({ error: "This account is not authorized for the CMS" }, { status: 403 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch { return NextResponse.json({ error: "Authentication is unavailable" }, { status: 503 }); }
}

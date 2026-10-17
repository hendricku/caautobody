import { after, NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/cms/admin-server";
import { startAdminLoginSchema } from "@/lib/cms/team-validation";
import { deliverAdminOtp } from "@/lib/cms/admin-otp";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const input = startAdminLoginSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  try {
    const normalizedEmail = input.data.email;
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumePublicRateLimit({ request, scope: "admin-otp-start-ip", limit: 5, windowSeconds: 15 * 60 }),
      consumePublicRateLimit({ request, scope: "admin-otp-start-email", identity: normalizedEmail, identityOnly: true, limit: 3, windowSeconds: 15 * 60 }),
    ]);
    // Keep a uniform response whether the address exists or is temporarily throttled.
    if (!ipAllowed || !emailAllowed) return NextResponse.json({ message: "If this account is authorized, an email with a code will arrive shortly." }, { headers: { "Cache-Control": "no-store" } });
    // Delivery runs after the uniform response, so provider timing cannot expose team membership.
    after(async () => {
      try { await deliverAdminOtp(normalizedEmail); }
      catch { console.warn("Admin OTP delivery is temporarily unavailable"); }
    });
    // Uniform response: never reveal whether an email is a registered administrator.
    return NextResponse.json({ message: "If this account is authorized, an email with a code will arrive shortly." }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 }); }
}

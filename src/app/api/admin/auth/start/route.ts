import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, supabaseForToken } from "@/lib/cms/admin-server";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { email } = await request.json().catch(() => ({ email: "" }));
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumePublicRateLimit({ request, scope: "admin-otp-start-ip", limit: 5, windowSeconds: 15 * 60 }),
      consumePublicRateLimit({ request, scope: "admin-otp-start-email", identity: normalizedEmail, limit: 3, windowSeconds: 15 * 60 }),
    ]);
    // Keep a uniform response whether the address exists or is temporarily throttled.
    if (!ipAllowed || !emailAllowed) return NextResponse.json({ message: "If this account is authorized, an email with a code will arrive shortly." }, { headers: { "Cache-Control": "no-store" } });
    const { error } = await supabaseForToken().auth.signInWithOtp({ email: normalizedEmail, options: { shouldCreateUser: false } });
    if (error) console.warn("OTP issue:", error.message);
    // Uniform response: never reveal whether an email is a registered administrator.
    return NextResponse.json({ message: "If this account is authorized, an email with a code will arrive shortly." }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 }); }
}

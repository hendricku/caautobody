import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/cms/admin-server";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";
import { analyticsConfiguration } from "@/lib/analytics/google-reporting";
import { getCachedGoogleAnalyticsReport } from "@/lib/analytics/report-cache";
import { filterFromSearchParams, resolveAnalyticsRange } from "@/lib/analytics/range";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Admin role required" }, { status: 403 });

  const parsed = filterFromSearchParams(request.nextUrl.searchParams);
  const range = parsed.success ? resolveAnalyticsRange(parsed.data) : null;
  if (!range) return NextResponse.json({ error: "Invalid reporting range" }, { status: 400 });

  try {
    const allowed = await consumePublicRateLimit({ request, scope: "admin-analytics-report", limit: 30, windowSeconds: 300, identity: admin.user.id });
    if (!allowed) return NextResponse.json({ error: "Too many report requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": "300" } });
  } catch {
    return NextResponse.json({ error: "Analytics reporting is temporarily unavailable." }, { status: 503 });
  }

  const configuration = analyticsConfiguration();
  if (!configuration.reportingConfigured) return NextResponse.json({ configuration, report: null }, { headers: { "Cache-Control": "private, no-store" } });

  try {
    const report = await getCachedGoogleAnalyticsReport(range);
    return NextResponse.json({ configuration, report }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Analytics reporting is temporarily unavailable.", configuration }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdmin } from "@/lib/cms/admin-server";
import { analyticsConfiguration, getGoogleAnalyticsReport } from "@/lib/analytics/google-reporting";

const readReport = unstable_cache(getGoogleAnalyticsReport, ["admin-google-analytics"], { revalidate: 300 });

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Admin role required" }, { status: 403 });

  const configuration = analyticsConfiguration();
  if (!configuration.reportingConfigured) return NextResponse.json({ configuration, report: null }, { headers: { "Cache-Control": "private, no-store" } });

  try {
    const report = await readReport();
    return NextResponse.json({ configuration, report }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Analytics reporting is temporarily unavailable.", configuration }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}

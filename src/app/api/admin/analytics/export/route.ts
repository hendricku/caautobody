import { NextRequest, NextResponse } from "next/server";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";
import { analyticsConfiguration } from "@/lib/analytics/google-reporting";
import { getCachedGoogleAnalyticsReport } from "@/lib/analytics/report-cache";
import { analyticsFilterSchema, resolveAnalyticsRange } from "@/lib/analytics/range";

export const runtime = "nodejs";
function escapeCsv(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = analyticsFilterSchema.safeParse(body);
  const range = parsed.success ? resolveAnalyticsRange(parsed.data) : null;
  if (!range) return NextResponse.json({ error: "Invalid reporting range" }, { status: 400 });
  try {
    const allowed = await consumePublicRateLimit({ request, scope: "admin-analytics-export", limit: 10, windowSeconds: 900, identity: admin.user.id });
    if (!allowed) return NextResponse.json({ error: "Too many export requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": "900" } });
  } catch { return NextResponse.json({ error: "Analytics export is temporarily unavailable." }, { status: 503 }); }
  if (!analyticsConfiguration().reportingConfigured) return NextResponse.json({ error: "Analytics reporting is not configured." }, { status: 503 });
  try {
    const report = await getCachedGoogleAnalyticsReport(range);
    if (!report) return NextResponse.json({ error: "Analytics reporting is not configured." }, { status: 503 });
    const { error: auditError } = await admin.client.rpc("cms_record_analytics_export", { p_start: range.start, p_end: range.end });
    if (auditError) return NextResponse.json({ error: "Analytics export is temporarily unavailable." }, { status: 503 });
    const rows: Array<Array<string | number>> = [
      ["CA Autobody analytics export", `${range.start} to ${range.end}`], [], ["GA4 overview"], ["Metric", "Value"], ["Sessions", report.overview.sessions], ["Users", report.overview.users], ["Page views", report.overview.pageViews], ["Engagement rate", `${report.overview.engagementRate}%`],
      [], ["Daily traffic"], ["Date", "Sessions", "Users", "Page views"], ...report.daily.map((row) => [row.date, row.sessions, row.users, row.pageViews]),
      [], ["Traffic channels"], ["Channel", "Sessions"], ...report.trafficSources.map((row) => [row.name, row.value]), [], ["Devices"], ["Device", "Sessions"], ...report.devices.map((row) => [row.name, row.value]),
      [], ["Most viewed pages"], ["Page", "Page views"], ...report.topPages.map((row) => [row.name, row.value]),
      [], ["Google Search Console"], ["Metric", "Value"], ["Status", report.search.status], ["Clicks", report.search.overview.clicks], ["Impressions", report.search.overview.impressions], ["CTR", `${report.search.overview.ctr}%`], ["Average position", report.search.overview.position],
      [], ["Search queries"], ["Query", "Clicks", "Impressions", "CTR", "Average position"], ...report.search.topQueries.map((row) => [row.name, row.clicks, row.impressions, `${row.ctr}%`, row.position]),
      [], ["Search pages"], ["Page", "Clicks", "Impressions", "CTR", "Average position"], ...report.search.topPages.map((row) => [row.name, row.clicks, row.impressions, `${row.ctr}%`, row.position]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="caautobody-analytics-${range.start}-to-${range.end}.csv"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Analytics export is temporarily unavailable." }, { status: 503 }); }
}

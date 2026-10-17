import "server-only";
import { unstable_cache } from "next/cache";
import { getGoogleAnalyticsReport } from "@/lib/analytics/google-reporting";
import type { AnalyticsRange } from "@/lib/analytics/range";

export function getCachedGoogleAnalyticsReport(range: AnalyticsRange) {
  return unstable_cache(() => getGoogleAnalyticsReport(range), ["admin-google-analytics", range.start, range.end], { revalidate: 300 })();
}

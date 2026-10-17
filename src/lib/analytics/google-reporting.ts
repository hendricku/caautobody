import "server-only";
import { createSign } from "node:crypto";
import type { AnalyticsRange } from "@/lib/analytics/range";

type GoogleConfiguration = {
  propertyId: string;
  searchConsoleSiteUrl?: string;
  serviceAccountEmail: string;
  privateKey: string;
};

export type MetricRow = { name: string; value: number };
export type SearchRow = { name: string; clicks: number; impressions: number; ctr: number; position: number };
export type SearchConsoleStatus = "connected" | "not_configured" | "permission_required" | "unavailable";

export type GoogleAnalyticsReport = {
  period: { start: string; end: string };
  overview: { sessions: number; users: number; pageViews: number; engagementRate: number };
  daily: Array<{ date: string; sessions: number; users: number; pageViews: number }>;
  trafficSources: MetricRow[];
  devices: MetricRow[];
  topPages: MetricRow[];
  search: { status: SearchConsoleStatus; overview: { clicks: number; impressions: number; ctr: number; position: number }; topQueries: SearchRow[]; topPages: SearchRow[] };
};

class GoogleRequestError extends Error {
  constructor(public status?: number) { super("Google reporting request failed"); }
}

function configuration(): GoogleConfiguration | null {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.trim();
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const searchConsoleSiteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim();

  if (!propertyId || !serviceAccountEmail || !privateKey) return null;
  if (!/^\d{4,20}$/.test(propertyId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(serviceAccountEmail) || !privateKey.includes("BEGIN PRIVATE KEY")) return null;
  if (searchConsoleSiteUrl && !/^https:\/\/[^\s]+\/$/.test(searchConsoleSiteUrl)) return null;
  return { propertyId, serviceAccountEmail, privateKey, searchConsoleSiteUrl };
}

export function analyticsConfiguration() {
  const reporting = configuration();
  return {
    trackingConfigured: /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA4_ID?.trim() || ""),
    reportingConfigured: Boolean(reporting),
    searchConsoleConfigured: Boolean(reporting?.searchConsoleSiteUrl),
  };
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function requestJson(url: string, init: RequestInit) {
  let response: Response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000), cache: "no-store" }); }
  catch { throw new GoogleRequestError(); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) throw new GoogleRequestError(response.status);
  return payload as Record<string, unknown>;
}

async function accessToken(config: GoogleConfiguration) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "RS256", typ: "JWT" });
  const claims = encode({
    iss: config.serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: issuedAt,
    exp: issuedAt + 3600,
  });
  const unsignedToken = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const assertion = `${unsignedToken}.${signer.sign(config.privateKey, "base64url")}`;
  const payload = await requestJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (typeof payload.access_token !== "string") throw new GoogleRequestError();
  return payload.access_token;
}

type DataApiRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };
type DataApiReport = { rows?: DataApiRow[] };
type SearchConsoleApiRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };

async function gaBatch(token: string, propertyId: string, range: AnalyticsRange) {
  const dateRanges = [{ startDate: range.start, endDate: range.end }];
  const requests = [
    { dateRanges, metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "engagementRate" }] },
    { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 366 },
    { dateRanges, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 },
    { dateRanges, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
    { dateRanges, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
  ];
  const payload = await requestJson(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  return Array.isArray(payload.reports) ? payload.reports as DataApiReport[] : [];
}

function metric(value?: string) {
  const number = Number(value || "0");
  return Number.isFinite(number) ? number : 0;
}

function percentage(value?: string | number) { return Math.round(metric(typeof value === "number" ? String(value) : value) * 10_000) / 100; }
function dateLabel(value = "") { return /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}` : value; }
function metricRows(rows: DataApiRow[]) { return rows.map((row) => ({ name: row.dimensionValues?.[0]?.value || "Unknown", value: metric(row.metricValues?.[0]?.value) })); }
function searchRows(rows: SearchConsoleApiRow[]) { return rows.map((row) => ({ name: row.keys?.[0] || "Unknown", clicks: metric(String(row.clicks || 0)), impressions: metric(String(row.impressions || 0)), ctr: percentage(row.ctr), position: Math.round(metric(String(row.position || 0)) * 10) / 10 })); }

async function searchConsole(token: string, siteUrl: string, range: AnalyticsRange, dimensions: string[]) {
  const payload = await requestJson(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: range.start, endDate: range.end, dimensions, rowLimit: 10, dataState: "final" }),
  });
  return Array.isArray(payload.rows) ? payload.rows as SearchConsoleApiRow[] : [];
}

export async function getGoogleAnalyticsReport(range: AnalyticsRange): Promise<GoogleAnalyticsReport | null> {
  const config = configuration();
  if (!config) return null;
  const token = await accessToken(config);
  const reports = await gaBatch(token, config.propertyId, range);
  const overview = reports[0]?.rows?.[0]?.metricValues || [];
  const search = { status: "not_configured" as SearchConsoleStatus, overview: { clicks: 0, impressions: 0, ctr: 0, position: 0 }, topQueries: [] as SearchRow[], topPages: [] as SearchRow[] };
  if (config.searchConsoleSiteUrl) {
    try {
      const [overviewRows, queryRows, pageRows] = await Promise.all([
        searchConsole(token, config.searchConsoleSiteUrl, range, []),
        searchConsole(token, config.searchConsoleSiteUrl, range, ["query"]),
        searchConsole(token, config.searchConsoleSiteUrl, range, ["page"]),
      ]);
      const row = overviewRows[0];
      search.status = "connected";
      search.overview = { clicks: metric(String(row?.clicks || 0)), impressions: metric(String(row?.impressions || 0)), ctr: percentage(row?.ctr), position: Math.round(metric(String(row?.position || 0)) * 10) / 10 };
      search.topQueries = searchRows(queryRows);
      search.topPages = searchRows(pageRows);
    } catch (error) {
      search.status = error instanceof GoogleRequestError && [401, 403].includes(error.status || 0) ? "permission_required" : "unavailable";
    }
  }
  return {
    period: range,
    overview: { sessions: metric(overview[0]?.value), users: metric(overview[1]?.value), pageViews: metric(overview[2]?.value), engagementRate: percentage(overview[3]?.value) },
    daily: (reports[1]?.rows || []).map((row) => ({ date: dateLabel(row.dimensionValues?.[0]?.value), sessions: metric(row.metricValues?.[0]?.value), users: metric(row.metricValues?.[1]?.value), pageViews: metric(row.metricValues?.[2]?.value) })),
    topPages: metricRows(reports[2]?.rows || []),
    trafficSources: metricRows(reports[3]?.rows || []),
    devices: metricRows(reports[4]?.rows || []),
    search,
  };
}

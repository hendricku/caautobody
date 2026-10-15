import "server-only";
import { createSign } from "node:crypto";

type GoogleConfiguration = {
  propertyId: string;
  searchConsoleSiteUrl?: string;
  serviceAccountEmail: string;
  privateKey: string;
};

type MetricRow = { name: string; value: number };

export type GoogleAnalyticsReport = {
  period: { start: string; end: string };
  overview: { sessions: number; users: number; pageViews: number };
  topPages: MetricRow[];
  topQueries: MetricRow[];
  searchConsoleConnected: boolean;
};

function dateRange() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const isoDate = (date: Date) => date.toISOString().slice(0, 10);
  return { start: isoDate(start), end: isoDate(end) };
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
    trackingConfigured: Boolean(process.env.NEXT_PUBLIC_GA4_ID?.trim() || process.env.NEXT_PUBLIC_GTM_ID?.trim()),
    reportingConfigured: Boolean(reporting),
    searchConsoleConfigured: Boolean(reporting?.searchConsoleSiteUrl),
  };
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
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
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { access_token?: unknown } | null;
  if (!response.ok || !payload || typeof payload.access_token !== "string") throw new Error("Google authorization failed");
  return payload.access_token;
}

type DataApiRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };

async function dataApi(token: string, propertyId: string, body: Record<string, unknown>) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { rows?: DataApiRow[] } | null;
  if (!response.ok || !payload) throw new Error("Google Analytics reporting failed");
  return payload.rows || [];
}

function metric(value?: string) {
  const number = Number(value || "0");
  return Number.isFinite(number) ? number : 0;
}

async function searchConsole(token: string, siteUrl: string, range: { start: string; end: string }) {
  const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: range.start, endDate: range.end, dimensions: ["query"], rowLimit: 6 }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { rows?: Array<{ keys?: string[]; clicks?: number }> } | null;
  if (!response.ok || !payload) throw new Error("Search Console reporting failed");
  return (payload.rows || []).map((row) => ({ name: row.keys?.[0] || "Unknown query", value: metric(String(row.clicks || 0)) }));
}

export async function getGoogleAnalyticsReport(): Promise<GoogleAnalyticsReport | null> {
  const config = configuration();
  if (!config) return null;

  const range = dateRange();
  const token = await accessToken(config);
  const [overviewRows, pageRows] = await Promise.all([
    dataApi(token, config.propertyId, { dateRanges: [{ startDate: range.start, endDate: range.end }], metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }] }),
    dataApi(token, config.propertyId, { dateRanges: [{ startDate: range.start, endDate: range.end }], dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 6 }),
  ]);
  const overview = overviewRows[0]?.metricValues || [];
  let topQueries: MetricRow[] = [];
  let searchConsoleConnected = false;
  if (config.searchConsoleSiteUrl) {
    try {
      topQueries = await searchConsole(token, config.searchConsoleSiteUrl, range);
      searchConsoleConnected = true;
    } catch {
      searchConsoleConnected = false;
    }
  }
  return {
    period: range,
    overview: { sessions: metric(overview[0]?.value), users: metric(overview[1]?.value), pageViews: metric(overview[2]?.value) },
    topPages: pageRows.map((row) => ({ name: row.dimensionValues?.[0]?.value || "/", value: metric(row.metricValues?.[0]?.value) })),
    topQueries,
    searchConsoleConnected,
  };
}

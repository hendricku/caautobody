"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type RangeKind = "last28" | "day" | "month" | "year" | "custom";
type Filter = { range: RangeKind; date?: string; month?: string; year?: string; start?: string; end?: string };
type MetricRow = { name: string; value: number };
type SearchRow = { name: string; clicks: number; impressions: number; ctr: number; position: number };
type Report = {
  period: { start: string; end: string };
  overview: { sessions: number; users: number; pageViews: number; engagementRate: number };
  daily: Array<{ date: string; sessions: number; users: number; pageViews: number }>;
  trafficSources: MetricRow[]; devices: MetricRow[]; topPages: MetricRow[];
  search: { status: "connected" | "not_configured" | "permission_required" | "unavailable"; overview: { clicks: number; impressions: number; ctr: number; position: number }; topQueries: SearchRow[]; topPages: SearchRow[] };
};
type AnalyticsResponse = { configuration: { trackingConfigured: boolean; reportingConfigured: boolean; searchConsoleConfigured: boolean }; report: Report | null; error?: string };

const number = new Intl.NumberFormat("en-AU");
const percent = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1 });
const latestCompleteDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const years = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - index));

function queryFor(filter: Filter) {
  const params = new URLSearchParams({ range: filter.range });
  for (const key of ["date", "month", "year", "start", "end"] as const) if (filter[key]) params.set(key, filter[key]);
  return params.toString();
}

export default function AdminAnalyticsDashboard() {
  const [filter, setFilter] = useState<Filter>({ range: "last28" });
  const [activeFilter, setActiveFilter] = useState<Filter>({ range: "last28" });
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = useCallback(async (next: Filter) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?${queryFor(next)}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as AnalyticsResponse | null;
      setData(result || { configuration: { trackingConfigured: false, reportingConfigured: false, searchConsoleConfigured: false }, report: null, error: "Analytics reporting is temporarily unavailable." });
    } catch { setData({ configuration: { trackingConfigured: false, reportingConfigured: false, searchConsoleConfigured: false }, report: null, error: "Analytics reporting is temporarily unavailable." }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(activeFilter); }, [activeFilter, load]);
  const report = data?.report;
  const configuration = data?.configuration;
  const rangeSummary = useMemo(() => report ? `${report.period.start} to ${report.period.end}` : "Select a period", [report]);

  function apply(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setActiveFilter(filter); }
  async function exportCsv() {
    setExportError("");
    setExporting(true);
    try {
      const response = await fetch("/api/admin/analytics/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(activeFilter) });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "The export could not be prepared.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `caautobody-analytics-${report?.period.start || "report"}.csv`; link.click(); URL.revokeObjectURL(url);
    } catch (error) { setExportError(error instanceof Error ? error.message : "The export could not be prepared."); }
    finally { setExporting(false); }
  }

  return <>
    <div className="admin-page-head admin-analytics-head"><div><span>Analytics</span><h1>Website performance</h1><p>Real GA4 and Google Search Console reporting. Dates use completed Melbourne business days.</p></div></div>
    <form className="admin-panel admin-analytics-controls" onSubmit={apply}>
      <div className="admin-analytics-controls__main"><label>Reporting period<select value={filter.range} onChange={(event) => setFilter({ range: event.target.value as RangeKind })}><option value="last28">Last 28 days</option><option value="day">Day</option><option value="month">Month</option><option value="year">Year</option><option value="custom">Custom range</option></select></label>
      {filter.range === "day" ? <label>Date<input type="date" max={latestCompleteDate} value={filter.date || ""} onChange={(event) => setFilter({ ...filter, date: event.target.value })} required /></label> : null}
      {filter.range === "month" ? <label>Month<input type="month" max={latestCompleteDate.slice(0, 7)} value={filter.month || ""} onChange={(event) => setFilter({ ...filter, month: event.target.value })} required /></label> : null}
      {filter.range === "year" ? <label>Year<select value={filter.year || ""} onChange={(event) => setFilter({ ...filter, year: event.target.value })} required><option value="" disabled>Select year</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label> : null}
      {filter.range === "custom" ? <><label>From<input type="date" max={latestCompleteDate} value={filter.start || ""} onChange={(event) => setFilter({ ...filter, start: event.target.value })} required /></label><label>To<input type="date" max={latestCompleteDate} value={filter.end || ""} onChange={(event) => setFilter({ ...filter, end: event.target.value })} required /></label></> : null}
      </div><div className="admin-analytics-controls__actions"><button className="admin-primary" type="submit" disabled={loading}>{loading ? "Loading…" : "Apply period"}</button><button type="button" className="admin-secondary" onClick={() => void exportCsv()} disabled={!report || exporting}>{exporting ? "Preparing…" : "Export CSV"}</button></div>
    </form>
    {exportError ? <p className="admin-analytics-export-error" role="alert">{exportError}</p> : null}
    {loading && !data ? <section className="admin-panel admin-analytics-loading"><p>Loading verified reporting data.</p></section> : null}
    {data?.error ? <section className="admin-panel admin-analytics-error" role="alert"><h2>Reporting is unavailable</h2><p>{data.error}</p></section> : null}
    {!loading && !configuration?.reportingConfigured ? <SetupState trackingConfigured={Boolean(configuration?.trackingConfigured)} /> : null}
    {report ? <>
      <section className="admin-analytics-period"><div><span>Reporting period</span><strong>{rangeSummary}</strong></div><small>GA4 is current to the selected completed day. Search Console commonly finalises more slowly.</small></section>
      <section className="admin-analytics-section"><div className="admin-analytics-section__head"><div><h2>Website traffic</h2><p>GA4</p></div></div><div className="metric-grid admin-analytics-metrics"><Metric label="Sessions" value={number.format(report.overview.sessions)} detail="Visits to the website" /><Metric label="Users" value={number.format(report.overview.users)} detail="Individual visitors" /><Metric label="Page views" value={number.format(report.overview.pageViews)} detail="Pages viewed" /><Metric label="Engagement rate" value={`${percent.format(report.overview.engagementRate)}%`} detail="Engaged sessions" /></div></section>
      <section className="admin-two-col admin-analytics-grid"><Trend rows={report.daily} /><MetricList title="Traffic channels" source="GA4" rows={report.trafficSources} empty="No channel data is available for this period." /><MetricList title="Devices" source="GA4" rows={report.devices} empty="No device data is available for this period." /><MetricList title="Most viewed pages" source="GA4" rows={report.topPages} empty="No page-view data is available for this period." /></section>
      <section className="admin-analytics-section admin-analytics-section--search"><div className="admin-analytics-section__head"><div><h2>Google Search performance</h2><p>{searchStatus(report.search.status)}</p></div></div><div className="metric-grid admin-analytics-metrics"><Metric label="Search clicks" value={number.format(report.search.overview.clicks)} detail="Visits from Google Search" /><Metric label="Impressions" value={number.format(report.search.overview.impressions)} detail="Appearances in Google Search" /><Metric label="CTR" value={`${percent.format(report.search.overview.ctr)}%`} detail="Clicks per impression" /><Metric label="Average position" value={percent.format(report.search.overview.position)} detail="Google Search ranking" /></div></section>
      <section className="admin-two-col admin-analytics-grid"><SearchList title="Search queries" rows={report.search.topQueries} empty={searchEmpty(report.search.status)} /><SearchList title="Search pages" rows={report.search.topPages} empty={searchEmpty(report.search.status)} /></section>
    </> : null}
  </>;
}

function SetupState({ trackingConfigured }: { trackingConfigured: boolean }) { return <section className="admin-panel admin-analytics-setup"><div className="panel-head"><div><h2>Finish analytics connection</h2><p>Reports are never estimated. The dashboard populates only after direct GA4 tracking and server-only Google reporting credentials are configured.</p></div></div><ol><li><b>{trackingConfigured ? "GA4 tracking configured" : "Add GA4 tracking"}</b><span>Set <code>NEXT_PUBLIC_GA4_ID</code> to the confirmed GA4 measurement ID, then redeploy.</span></li><li><b>Set server-only reporting values</b><span>Set the GA4 property ID, Search Console site URL, service-account email and private key. Never use <code>NEXT_PUBLIC_</code> for these values.</span></li><li><b>Verify Google access</b><span>The service account needs GA4 Viewer access and Search Console read permission for the exact property URL.</span></li><li><b>Review privacy choices</b><span>Visitor analytics starts only after the visitor accepts the optional analytics preference.</span></li></ol></section>; }
function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <article><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function MetricList({ title, source, rows, empty }: { title: string; source: string; rows: MetricRow[]; empty: string }) { return <section className="admin-panel"><div className="panel-head"><div><h2>{title}</h2></div><small>{source}</small></div><List rows={rows} empty={empty} /></section>; }
function List({ rows, empty }: { rows: MetricRow[]; empty: string }) { if (!rows.length) return <p className="admin-analytics-empty-copy">{empty}</p>; const highest = Math.max(...rows.map((row) => row.value), 1); return <div className="admin-analytics-list">{rows.map((row) => <div key={row.name}><span title={row.name}>{row.name}</span><i aria-hidden="true"><b style={{ width: `${Math.max((row.value / highest) * 100, 4)}%` }} /></i><strong>{number.format(row.value)}</strong></div>)}</div>; }
function Trend({ rows }: { rows: Report["daily"] }) { const max = Math.max(...rows.map((row) => row.sessions), 1); return <section className="admin-panel admin-analytics-trend"><div className="panel-head"><div><h2>Daily sessions</h2><p>GA4</p></div></div>{rows.length ? <ol>{rows.map((row) => <li key={row.date} title={`${row.date}: ${number.format(row.sessions)} sessions`}><i style={{ height: `${Math.max((row.sessions / max) * 100, 3)}%` }} /><span>{row.date.slice(5)}</span></li>)}</ol> : <p className="admin-analytics-empty-copy">No daily traffic data is available for this period.</p>}</section>; }
function SearchList({ title, rows, empty }: { title: string; rows: SearchRow[]; empty: string }) { return <section className="admin-panel admin-search-list"><div className="panel-head"><div><h2>{title}</h2></div><small>Search Console</small></div>{rows.length ? <div role="table"><div role="row" className="admin-search-list__head"><span>Item</span><span>Clicks</span><span>Impressions</span><span>CTR</span><span>Position</span></div>{rows.map((row) => <div role="row" key={row.name}><span title={row.name}>{row.name}</span><b>{number.format(row.clicks)}</b><b>{number.format(row.impressions)}</b><b>{percent.format(row.ctr)}%</b><b>{percent.format(row.position)}</b></div>)}</div> : <p className="admin-analytics-empty-copy">{empty}</p>}</section>; }
function searchStatus(status: Report["search"]["status"]) { return ({ connected: "Search Console connected", not_configured: "Search Console not configured", permission_required: "Search Console permission required", unavailable: "Search Console temporarily unavailable" })[status]; }
function searchEmpty(status: Report["search"]["status"]) { return status === "connected" ? "No Search Console data is available for this period." : searchStatus(status); }

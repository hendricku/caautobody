"use client";

import { useCallback, useEffect, useState } from "react";

type MetricRow = { name: string; value: number };
type AnalyticsResponse = {
  configuration: { trackingConfigured: boolean; reportingConfigured: boolean; searchConsoleConfigured: boolean };
  report: null | {
    period: { start: string; end: string };
    overview: { sessions: number; users: number; pageViews: number };
    topPages: MetricRow[];
    topQueries: MetricRow[];
    searchConsoleConnected: boolean;
  };
  error?: string;
};

const formatNumber = new Intl.NumberFormat("en-AU");

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      const result = await response.json().catch(() => null) as AnalyticsResponse | null;
      setData(result || { configuration: { trackingConfigured: false, reportingConfigured: false, searchConsoleConfigured: false }, report: null, error: "Analytics reporting is temporarily unavailable." });
    } catch {
      setData({ configuration: { trackingConfigured: false, reportingConfigured: false, searchConsoleConfigured: false }, report: null, error: "Analytics reporting is temporarily unavailable." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const configuration = data?.configuration;
  const report = data?.report;
  return <>
    <div className="admin-page-head admin-analytics-head"><div><span>Analytics</span><h1>Website analytics</h1><p>Traffic and search data from the last 28 completed days.</p></div>{report ? <button type="button" className="admin-primary" onClick={() => void load()} disabled={loading}>{loading ? "Checking connection…" : "Check connection"}</button> : null}</div>
    {loading && !data ? <section className="admin-panel admin-analytics-loading"><p>Checking the analytics connection.</p></section> : null}
    {data?.error ? <section className="admin-panel admin-analytics-error" role="alert"><h2>Reporting is unavailable</h2><p>{data.error}</p></section> : null}
    {!loading && !configuration?.reportingConfigured ? <section className="admin-panel admin-analytics-setup"><div className="panel-head"><div><h2>Connect website reporting</h2><p>Analytics is not estimated or mocked. The dashboard will populate only after Google access is configured.</p></div></div><ol><li><b>{configuration?.trackingConfigured ? "Tracking is connected" : "Add website tracking"}</b><span>Set <code>NEXT_PUBLIC_GA4_ID</code> or <code>NEXT_PUBLIC_GTM_ID</code> in Vercel, then redeploy the site.</span></li><li><b>Create a reporting service account</b><span>Enable Google Analytics Data API and Google Search Console API in Google Cloud. Create a service account key and keep it server-only.</span></li><li><b>Grant read-only access</b><span>Add the service account email as Viewer in GA4 and Full user in Search Console for this website.</span></li><li><b>Add the private environment values</b><span>Set the property, Search Console site URL, service account email, and private key shown in <code>.env.example</code>. Redeploy to activate reporting.</span></li></ol></section> : null}
    {report ? <>
      <section className="admin-analytics-period"><span>Reporting period</span><strong>{report.period.start} to {report.period.end}</strong><small>{report.searchConsoleConnected ? "GA4 and Search Console connected" : "GA4 connected. Search Console is not available yet."}</small></section>
      <section className="metric-grid admin-analytics-metrics"><article><span>Sessions</span><strong>{formatNumber.format(report.overview.sessions)}</strong><small>Visits to the website</small></article><article><span>Users</span><strong>{formatNumber.format(report.overview.users)}</strong><small>Individual visitors</small></article><article><span>Page views</span><strong>{formatNumber.format(report.overview.pageViews)}</strong><small>Pages viewed</small></article></section>
      <div className="admin-two-col admin-analytics-grid"><section className="admin-panel"><div className="panel-head"><div><h2>Most viewed pages</h2></div><small>GA4</small></div><ReportList rows={report.topPages} empty="No page-view data is available for this period." /></section><section className="admin-panel"><div className="panel-head"><div><h2>Search queries</h2></div><small>Search Console</small></div><ReportList rows={report.topQueries} empty={report.searchConsoleConnected ? "No search-query data is available for this period." : "Connect Search Console access to see organic search queries."} /></section></div>
    </> : null}
  </>;
}

function ReportList({ rows, empty }: { rows: MetricRow[]; empty: string }) {
  if (!rows.length) return <p className="admin-analytics-empty-copy">{empty}</p>;
  const highest = Math.max(...rows.map((row) => row.value), 1);
  return <div className="admin-analytics-list">{rows.map((row) => <div key={row.name}><span title={row.name}>{row.name}</span><i aria-hidden="true"><b style={{ width: `${Math.max((row.value / highest) * 100, 4)}%` }} /></i><strong>{formatNumber.format(row.value)}</strong></div>)}</div>;
}

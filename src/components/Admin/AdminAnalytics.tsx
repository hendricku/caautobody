"use client";
import { useEffect, useState } from "react";
import { AnalyticsSnapshot, mockAnalyticsService } from "@/lib/google/analytics";
export default function AdminAnalytics(){
  const [range,setRange]=useState("30 days");
  const [data,setData]=useState<AnalyticsSnapshot|null>(null);
  useEffect(()=>{setData(null);mockAnalyticsService.getSnapshot(range).then(setData)},[range]);
  if(!data)return <div className="admin-loading">Loading mock analytics…</div>;
  return <>
    <div className="admin-page-head"><div><span>Google Analytics</span><h1>Analytics overview</h1><p>Mock interface ready to connect to GA4 Data API and Search Console in the backend phase.</p></div><select value={range} onChange={(e)=>setRange(e.target.value)}><option>7 days</option><option>30 days</option><option>90 days</option></select></div>
    <div className="metric-grid">{data.metrics.map((metric)=><article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small className={metric.trend}>{metric.trend==="up"?"↑":"↓"} {metric.delta} vs previous period</small></article>)}</div>
    <div className="admin-two-col"><section className="admin-panel"><div className="panel-head"><div><span>Acquisition</span><h2>Traffic sources</h2></div><small>Mock GA4</small></div><div className="bar-list">{data.traffic.map((item)=><div key={item.source}><div><span>{item.source}</span><b>{item.value}%</b></div><i><em style={{width:`${item.value}%`}}/></i></div>)}</div></section><section className="admin-panel"><div className="panel-head"><div><span>Audience</span><h2>Device mix</h2></div><small>Mock GA4</small></div><div className="device-chart">{data.devices.map((item)=><div key={item.source}><strong>{item.value}%</strong><span>{item.source}</span></div>)}</div></section></div>
    <section className="admin-panel"><div className="panel-head"><div><span>Content performance</span><h2>Top pages</h2></div><small>Views & conversions</small></div><div className="admin-table"><div className="admin-table__row head"><span>Page</span><span>Views</span><span>Conversions</span></div>{data.pages.map((item)=><div className="admin-table__row" key={item.page}><strong>{item.page}</strong><span>{item.views.toLocaleString()}</span><span>{item.conversions}</span></div>)}</div></section>
    <section className="admin-panel"><div className="panel-head"><div><span>Search Console</span><h2>Search performance</h2></div><small>Mock Search Console API</small></div><div className="admin-table search"><div className="admin-table__row head"><span>Query</span><span>Clicks</span><span>Impressions</span><span>Avg. position</span></div>{data.searchQueries.map((item)=><div className="admin-table__row" key={item.query}><strong>{item.query}</strong><span>{item.clicks}</span><span>{item.impressions.toLocaleString()}</span><span>{item.position}</span></div>)}</div></section>
  </>;
}

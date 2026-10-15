export default function AdminAnalytics() {
  return <>
    <div className="admin-page-head"><div><span>Analytics</span><h1>Website analytics</h1><p>Live reporting will appear here once GA4 and Search Console access are connected.</p></div></div>
    <section className="admin-panel admin-analytics-empty"><div className="panel-head"><div><h2>Analytics is not connected</h2></div><small>Data is not estimated or mocked.</small></div><p>Connect a Google Analytics 4 property and an approved Search Console integration before using this dashboard for traffic, conversion, or search reporting.</p><dl><div><dt>Website tracking</dt><dd>Set <code>NEXT_PUBLIC_GA4_ID</code> or <code>NEXT_PUBLIC_GTM_ID</code> in the deployment environment.</dd></div><div><dt>Dashboard reporting</dt><dd>Provide a server-only Google service account with read-only access to the approved GA4 property and Search Console property.</dd></div></dl></section>
  </>;
}

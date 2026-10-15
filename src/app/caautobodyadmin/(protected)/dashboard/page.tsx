import Link from "next/link";
import { getAdmin } from "@/lib/cms/admin-server";
import { redirect } from "next/navigation";

export const dynamic="force-dynamic";
export default async function AdminDashboard(){
  const admin = await getAdmin(); if(!admin) redirect("/caautobodyadmin/login");
  const tables=["cms_blog_posts","cms_services","cms_faqs","cms_gallery_items"];
  const stats=await Promise.all(tables.map(async table=>{const {count,error}=await admin.client.from(table).select("id",{head:true,count:"exact"}).eq("status","published");return error ? null : count;}));
  return <><div className="admin-page-head"><div><span>Overview</span><h1>Website dashboard</h1><p>Live published-content totals and securely managed CMS workflows.</p></div><Link className="admin-primary" href="/" target="_blank">Open website ↗</Link></div>
    <div className="metric-grid admin-summary">{["Published blogs","Published services","Published FAQs","Gallery assets"].map((label,index)=><article key={label}><span>{label}</span><strong>{stats[index] ?? "—"}</strong><small>{stats[index]===null?"Database query unavailable":"Supabase published records"}</small></article>)}</div>
    <div className="admin-two-col dashboard-columns"><section className="admin-panel"><div className="panel-head"><h2>Quick actions</h2></div><div className="quick-actions">{[["Manage blog articles","blogs"],["Manage services","services"],["Manage gallery","gallery"],["Manage FAQs","faq"],["Manage offers","offers"],["Manage local areas","areas"]].map(([label,path])=><Link href={`/caautobodyadmin/${path}`} key={path}><i>↗</i><span><strong>{label}</strong><small>Changes are stored in Supabase.</small></span><b>→</b></Link>)}</div></section><section className="admin-panel"><div className="panel-head"><h2>Security and publishing</h2></div><div className="status-list"><div><span>Signed-in role</span><b className="status-ok">{admin.role}</b></div><div><span>OTP identity</span><b className="status-ok">Verified</b></div><div><span>Database writes</span><b className="status-ok">RLS protected</b></div><div><span>Media workflow</span><b>Private staging / published</b></div><div><span>Analytics API</span><b className="status-warn">Needs GA4 credentials</b></div></div></section></div>
    <section className="admin-panel"><h2>Publication reminder</h2><p className="admin-note">Editors can save drafts only. Publishers/Admins can publish or retire content. CMS changes take effect after route revalidation. All historical records remain available in Supabase.</p></section>
  </>;
}

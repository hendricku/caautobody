import Link from "next/link";
import Icon from "@/components/UI/Icon";
import { getAdmin } from "@/lib/cms/admin-server";
import { redirect } from "next/navigation";

export const dynamic="force-dynamic";
export default async function AdminDashboard(){
  const admin = await getAdmin(); if(!admin) redirect("/caautobodyadmin/login");
  const tables=[["Published blogs","cms_blog_posts"],["Published services","cms_services"],["Published FAQs","cms_faqs"],["Gallery assets","cms_gallery_items"]] as const;
  const stats=await Promise.all(tables.map(async ([label,table])=>{
    const [publishedResult,draftResult]=await Promise.all([
      admin.client.from(table).select("id",{head:true,count:"exact"}).eq("status","published"),
      admin.client.from(table).select("id",{head:true,count:"exact"}).eq("status","draft"),
    ]);
    return {label,published:publishedResult.error?null:publishedResult.count,drafts:draftResult.error?null:draftResult.count};
  }));
  return <><div className="admin-page-head"><div><span>Overview</span><h1>Website dashboard</h1><p>Live published-content totals and securely managed CMS workflows.</p></div><Link className="admin-primary" href="/" target="_blank" rel="noopener noreferrer">Open website <Icon name="arrow-outward" /></Link></div>
    <div className="metric-grid admin-summary">{stats.map((stat)=><article key={stat.label}><span>{stat.label}</span><strong>{stat.published ?? "—"}</strong><small>{stat.published===null?"Database query unavailable":`${stat.drafts ?? 0} draft${stat.drafts===1?"":"s"} awaiting publication`}</small></article>)}</div>
    <div className="admin-two-col dashboard-columns"><section className="admin-panel"><div className="panel-head"><h2>Quick actions</h2></div><div className="quick-actions">{[["Manage blog articles","blogs"],["Manage services","services"],["Manage gallery","gallery"],["Manage FAQs","faq"],["Manage offers","offers"],["Manage local areas","areas"]].map(([label,path])=><Link href={`/caautobodyadmin/${path}`} key={path}><i aria-hidden="true"><Icon name="arrow-outward" /></i><span><strong>{label}</strong><small>Changes are stored in Supabase.</small></span><b aria-hidden="true"><Icon name="arrow-forward" /></b></Link>)}</div></section><section className="admin-panel"><div className="panel-head"><h2>Security and publishing</h2></div><div className="status-list"><div><span>Signed-in role</span><b className="status-ok">{admin.role}</b></div><div><span>OTP identity</span><b className="status-ok">Verified</b></div><div><span>Database writes</span><b className="status-ok">RLS protected</b></div><div><span>Media workflow</span><b>Private staging / published</b></div></div></section></div>
    <section className="admin-panel"><h2>Publication reminder</h2><p className="admin-note">Editors can save drafts only. Publishers/Admins can publish or retire content. Published updates revalidate the relevant route and open public pages refresh from the CMS publication signal. All historical records remain available in Supabase.</p></section>
  </>;
}

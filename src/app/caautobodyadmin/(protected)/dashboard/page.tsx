import Link from "next/link";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import MapOutlined from "@mui/icons-material/MapOutlined";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { getAdmin } from "@/lib/cms/admin-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const libraries = [
  { label: "Blog articles", table: "cms_blog_posts", href: "blogs", icon: ArticleOutlined },
  { label: "Services", table: "cms_services", href: "services", icon: BuildOutlined },
  { label: "FAQs", table: "cms_faqs", href: "faq", icon: QuizOutlined },
  { label: "Gallery images", table: "cms_gallery_items", href: "gallery", icon: CollectionsOutlined },
  { label: "Offers", table: "cms_offers", href: "offers", icon: LocalOfferOutlined },
  { label: "Service areas", table: "cms_locations", href: "areas", icon: MapOutlined },
] as const;

export default async function AdminDashboard() {
  const admin = await getAdmin();
  if (!admin) redirect("/caautobodyadmin/login");

  // Keep the existing live Supabase counts and role source. No new reporting logic.
  const stats = await Promise.all(libraries.map(async (library) => {
    const [published, drafts] = await Promise.all([
      admin.client.from(library.table).select("id", { head: true, count: "exact" }).eq("status", "published"),
      admin.client.from(library.table).select("id", { head: true, count: "exact" }).eq("status", "draft"),
    ]);
    return { ...library, published: published.error ? null : published.count, drafts: drafts.error ? null : drafts.count };
  }));
  const featured = stats.slice(0, 4);
  const draftTotal = stats.some((entry) => entry.drafts === null) ? null : stats.reduce((total, entry) => total + (entry.drafts ?? 0), 0);
  const publishedTotal = stats.some((entry) => entry.published === null) ? null : stats.reduce((total, entry) => total + (entry.published ?? 0), 0);

  return <div className="admin-dashboard-v2">
    <header className="admin-dashboard-v2__hero">
      <div className="admin-dashboard-v2__welcome">
        <span className="admin-dashboard-v2__eyebrow"><span aria-hidden="true" /> CMS WORKSPACE</span>
        <h1>Website overview<span>.</span></h1>
        <p>Your content, publishing activity, and essential tools—one organized workspace.</p>
        <div className="admin-dashboard-v2__hero-meta"><span><CheckCircleOutlineRounded fontSize="small" /> Content management</span><span><LockOutlined fontSize="small" /> Role: <strong>{admin.role}</strong></span></div>
      </div>
      <div className="admin-dashboard-v2__hero-actions">
        <Link className="admin-dashboard-v2__outline" href="/caautobodyadmin/blogs/new"><AddRounded fontSize="small" /> New article</Link>
        <Link className="admin-dashboard-v2__site-link" href="/" target="_blank" rel="noopener noreferrer">View live website <ArrowOutwardRounded fontSize="small" /></Link>
      </div>
    </header>

    <div className="admin-dashboard-v2__section-heading"><div><span>01 / PUBLISHING</span><h2>Content at a glance</h2></div><span className="admin-dashboard-v2__section-note">Live counts from your CMS</span></div>
    <div className="admin-dashboard-v2__metrics">
      {featured.map((stat, index) => <Link className="admin-dashboard-v2__metric" href={`/caautobodyadmin/${stat.href}`} key={stat.href}>
        <div className="admin-dashboard-v2__metric-top"><span className="admin-dashboard-v2__metric-icon"><stat.icon fontSize="small" /></span><span className="admin-dashboard-v2__metric-index">0{index + 1}</span></div>
        <strong>{stat.published ?? "—"}</strong>
        <div className="admin-dashboard-v2__metric-bottom"><span>{stat.label}</span><ArrowOutwardRounded fontSize="small" /></div>
        <small>{stat.published === null ? "Data temporarily unavailable" : `${stat.drafts ?? 0} draft${stat.drafts === 1 ? "" : "s"} in progress`}</small>
      </Link>)}
    </div>

    <div className="admin-dashboard-v2__body">
      <section className="admin-dashboard-v2__library admin-panel">
        <div className="admin-dashboard-v2__panel-head"><div><span>02 / LIBRARIES</span><h2>Manage your content</h2><p>Jump straight into any collection to edit, preview, and publish.</p></div><ArrowOutwardRounded fontSize="small" /></div>
        <div className="admin-dashboard-v2__links">
          {stats.map((stat) => <Link key={stat.href} href={`/caautobodyadmin/${stat.href}`}>
            <span className="admin-dashboard-v2__link-icon"><stat.icon fontSize="small" /></span>
            <span className="admin-dashboard-v2__link-name"><strong>{stat.label}</strong><small>{stat.published === null ? "Count unavailable" : `${stat.published} published`}</small></span>
            {stat.drafts !== null && stat.drafts > 0 ? <span className="admin-dashboard-v2__draft-count">{stat.drafts} draft{stat.drafts === 1 ? "" : "s"}</span> : null}
            <ArrowOutwardRounded className="admin-dashboard-v2__link-arrow" fontSize="small" />
          </Link>)}
        </div>
      </section>
      <aside className="admin-dashboard-v2__rail">
        <section className="admin-panel admin-dashboard-v2__snapshot">
          <div className="admin-dashboard-v2__panel-head"><div><span>03 / STATUS</span><h2>Publishing snapshot</h2><p>Across all six content libraries</p></div></div>
          <div className="admin-dashboard-v2__snapshot-numbers"><div><strong>{publishedTotal ?? "—"}</strong><span>Published</span></div><div><strong>{draftTotal ?? "—"}</strong><span>Drafts</span></div></div>
          <div className="admin-dashboard-v2__snapshot-note"><CheckCircleOutlineRounded fontSize="small" /><span>Records and publishing permissions are managed securely by the existing CMS.</span></div>
        </section>
        <section className="admin-panel admin-dashboard-v2__tools">
          <div className="admin-dashboard-v2__panel-head"><div><span>04 / RESOURCES</span><h2>Workspace tools</h2></div></div>
          <Link href="/caautobodyadmin/analytics">Site analytics <ArrowOutwardRounded fontSize="small" /></Link>
          <Link href="/caautobodyadmin/contacts">Contact management <ArrowOutwardRounded fontSize="small" /></Link>
          <Link href="/caautobodyadmin/guide">Admin user guide <ArrowOutwardRounded fontSize="small" /></Link>
        </section>
      </aside>
    </div>
  </div>;
}

"use client";
import Image from "next/image";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ElementType } from "react";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import ContactMailOutlined from "@mui/icons-material/ContactMailOutlined";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MapOutlined from "@mui/icons-material/MapOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import MenuRounded from "@mui/icons-material/MenuRounded";
import ReorderRounded from "@mui/icons-material/ReorderRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import AnalyticsOutlined from "@mui/icons-material/AnalyticsOutlined";
import AddRounded from "@mui/icons-material/AddRounded";
import AdminAutoGrow from "./AdminAutoGrow";
import AdminLiveSync from "./AdminLiveSync";
import type { ContactEnquiry } from "@/lib/enquiries";
import { media } from "@/lib/media";

type NavigationEntry = readonly [label: string, href: string, Icon: ElementType<{ fontSize?: "small" }>];
type NavigationGroup = { label: string; links: readonly NavigationEntry[] };
type Viewer = { email: string; role: string };

const navigation: readonly NavigationGroup[] = [
  { label: "Workspace", links: [["Dashboard", "/caautobodyadmin/dashboard", DashboardRounded]] },
  { label: "Content", links: [["Blogs", "/caautobodyadmin/blogs", ArticleOutlined], ["Services", "/caautobodyadmin/services", BuildOutlined], ["Menu arrangement", "/caautobodyadmin/menu-arrangement", ReorderRounded], ["Offers", "/caautobodyadmin/offers", LocalOfferOutlined], ["Areas we serve", "/caautobodyadmin/areas", MapOutlined], ["Gallery", "/caautobodyadmin/gallery", CollectionsOutlined], ["FAQ", "/caautobodyadmin/faq", QuizOutlined]] },
  { label: "Operations", links: [["Contact management", "/caautobodyadmin/contacts", ContactMailOutlined], ["Analytics", "/caautobodyadmin/analytics", AnalyticsOutlined], ["Audit log", "/caautobodyadmin/audit", HistoryOutlined]] },
  { label: "Administration", links: [["Team & access", "/caautobodyadmin/team", GroupOutlined], ["Settings", "/caautobodyadmin/settings", SettingsOutlined], ["Notes & guide", "/caautobodyadmin/guide", MenuBookOutlined]] },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<ContactEnquiry[]>([]);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const activeGroup = navigation.find((group) => group.links.some(([, href]) => isActive(pathname, href)));
  const activeItem = activeGroup?.links.find(([, href]) => isActive(pathname, href));
  const unreadCount = notifications.filter((item) => item.status === "new").length;
  const initials = viewer?.email ? viewer.email.slice(0, 2).toUpperCase() : "CA";
  const newPage = (["blogs", "services", "offers", "areas", "gallery", "faq"] as const)
    .find((section) => pathname === `/caautobodyadmin/${section}`);
  const newLabels: Record<string, string> = { blogs: "New article", services: "New service", offers: "New offer", areas: "New area", gallery: "New image", faq: "New FAQ" };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setProfileOpen(false);
      setNotificationsOpen(false);
      setMenuOpen(false);
    };
    const closeProfile = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeProfile);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeProfile);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function refreshEnquiries() {
      try {
        const response = await fetch("/api/admin/enquiries", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setNotifications(data.items || []);
      } catch { /* Keep existing notifications if the connection drops. */ }
    }
    void refreshEnquiries();
    void fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setViewer(data?.email && data?.role ? data : null); })
      .catch(() => { if (active) setViewer(null); });
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshEnquiries();
    }, 20_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [pathname]);

  async function signOut() {
    setProfileOpen(false);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/caautobodyadmin/login");
    router.refresh();
  }

  return <div className={`admin-root ${collapsed ? "admin-root--collapsed" : ""}`}>
    <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`} aria-label="CMS navigation">
      <div className="admin-brand">
        <Image src={media.logo} alt="CA Chelsea Autobody"  width={640} height={320} unoptimized />
        <span>Website Admin<small>Content workspace</small></span>
        <button className="admin-sidebar__toggle" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRightRounded fontSize="small" /> : <ChevronLeftRounded fontSize="small" />}</button>
      </div>
      <nav>{navigation.map((group) => <section className="admin-sidebar__group" key={group.label} aria-label={group.label}>
        <span className="admin-sidebar__group-label">{group.label}</span>
        {group.links.map(([label, href, Icon]) => <Link key={href} href={href} className={isActive(pathname, href) ? "active" : ""} onClick={() => setMenuOpen(false)} title={collapsed ? label : undefined} aria-current={isActive(pathname, href) ? "page" : undefined}><Icon fontSize="small" /><span>{label}</span></Link>)}
      </section>)}</nav>
      <div className="admin-sidebar__foot"><Link href="/" target="_blank" rel="noopener noreferrer"><OpenInNewRounded fontSize="small" /><span>View website</span></Link>
        <div className="admin-sidebar__account">          <div className="admin-profile" ref={profileRef}>
            <button className="admin-profile__trigger" type="button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} aria-haspopup="menu" aria-expanded={profileOpen}><b>{initials}</b><span>{viewer?.role || "CMS access"}<small>{viewer?.email || "Verifying session"}</small></span><ExpandMoreRounded className={profileOpen ? "is-open" : ""} fontSize="small" /></button>
            {profileOpen ? <div className="admin-profile__menu" role="menu"><p><strong>{viewer?.email || "CMS account"}</strong><small>{viewer?.role || "CMS access"}</small></p><button type="button" role="menuitem" onClick={() => void signOut()}><LogoutRounded fontSize="small" />Sign out</button></div> : null}
          </div></div>
      </div>
    </aside>

    <div className="admin-main">
      <header className="admin-topbar">
        <button type="button" className="admin-menu" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}><MenuRounded fontSize="small" /></button>
        <div className="admin-topbar__context"><nav aria-label="Breadcrumb" className="admin-breadcrumbs"><span>CA Autobody</span><span>{activeGroup?.label || "Workspace"}</span></nav><b>{activeItem?.[0] || "Website Admin"}</b></div>
        <div className="admin-topbar__actions">
          {newPage ? <Link className="admin-topbar__add" href={`/caautobodyadmin/${newPage}/new`}><AddRounded fontSize="small" />{newLabels[newPage]}</Link> : null}
          <div className="admin-notifications">
            <button className="admin-icon-button" type="button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={notificationsOpen}><NotificationsNoneRounded fontSize="small" />{unreadCount ? <b>{unreadCount > 9 ? "9+" : unreadCount}</b> : null}</button>
            {notificationsOpen ? <div className="admin-notifications__panel"><header><strong>New enquiries</strong><small>Customer activity</small></header>{notifications.length ? notifications.slice(0, 4).map((item) => <Link key={item.id} href="/caautobodyadmin/contacts" onClick={() => setNotificationsOpen(false)}><span><b>{item.name}</b><small>{item.service}</small></span><time>{item.status}</time></Link>) : <p>No contact notifications yet.</p>}<Link className="admin-notifications__all" href="/caautobodyadmin/contacts" onClick={() => setNotificationsOpen(false)}>Open contact management</Link></div> : null}
          </div>

        </div>
      </header>
      <main className="admin-content">{children}</main>
    </div>
    <AdminAutoGrow route={pathname} />
    <AdminLiveSync />
    {menuOpen ? <button aria-label="Close menu" className="admin-backdrop" onClick={() => setMenuOpen(false)} /> : null}
  </div>;
}

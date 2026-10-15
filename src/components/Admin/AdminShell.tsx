"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import MapOutlined from "@mui/icons-material/MapOutlined";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import AnalyticsOutlined from "@mui/icons-material/AnalyticsOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import MenuRounded from "@mui/icons-material/MenuRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import ContactMailOutlined from "@mui/icons-material/ContactMailOutlined";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import CircleRounded from "@mui/icons-material/CircleRounded";
import type { ContactEnquiry } from "@/lib/enquiries";
import { media } from "@/lib/media";

const links = [
  ["Dashboard", "/caautobodyadmin/dashboard", DashboardRounded],
  ["Blogs", "/caautobodyadmin/blogs", ArticleOutlined],
  ["Services", "/caautobodyadmin/services", BuildOutlined],
  ["Offers", "/caautobodyadmin/offers", LocalOfferOutlined],
  ["Areas we serve", "/caautobodyadmin/areas", MapOutlined],
  ["Gallery", "/caautobodyadmin/gallery", CollectionsOutlined],
  ["FAQ", "/caautobodyadmin/faq", QuizOutlined],
  ["Contact management", "/caautobodyadmin/contacts", ContactMailOutlined],
  ["Analytics", "/caautobodyadmin/analytics", AnalyticsOutlined],
  ["Team & access", "/caautobodyadmin/team", GroupOutlined],
  ["Audit log", "/caautobodyadmin/audit", HistoryOutlined],
  ["Settings", "/caautobodyadmin/settings", SettingsOutlined],
] as const;

type Viewer = { email: string; role: string };

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<ContactEnquiry[]>([]);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeProfile);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeProfile);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/enquiries", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { items: [] })
      .then((result) => { if (active) setNotifications(result.items || []); })
      .catch(() => { if (active) setNotifications([]); });
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => { if (active && result?.email && result?.role) setViewer(result); })
      .catch(() => { if (active) setViewer(null); });
    return () => { active = false; };
  }, [pathname]);

  const unreadCount = notifications.filter((item) => item.status === "new").length;

  function toggleNotifications() {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next) setProfileOpen(false);
  }

  async function signOut() {
    setProfileOpen(false);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/caautobodyadmin/login");
    router.refresh();
  }

  return <div className={`admin-root ${collapsed ? "admin-root--collapsed" : ""}`}>
    <aside className={`admin-sidebar ${open ? "open" : ""}`}>
      <div className="admin-brand"><img src={media.logo} alt="CA Chelsea Autobody" /><span>Website Admin<small>Content workspace</small></span><button className="admin-sidebar__toggle" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRightRounded fontSize="small" /> : <ChevronLeftRounded fontSize="small" />}</button></div>
      <nav>{links.map(([label, href, Icon]) => <Link key={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""} href={href} onClick={() => setOpen(false)} title={collapsed ? label : undefined}><Icon fontSize="small" /><span>{label}</span></Link>)}</nav>
      <div className="admin-sidebar__foot"><Link href="/" target="_blank"><OpenInNewRounded fontSize="small" /><span>View website</span></Link></div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar"><button type="button" className="admin-menu" onClick={() => setOpen((value) => !value)} aria-label="Open menu"><MenuRounded fontSize="small" /></button><div><span>CA Autobody</span><small>Content &amp; administration</small></div><div className="admin-topbar__actions"><div className="admin-notifications"><button className="admin-icon-button" type="button" onClick={toggleNotifications} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={notificationsOpen}><NotificationsNoneRounded fontSize="small" />{unreadCount ? <b>{unreadCount > 9 ? "9+" : unreadCount}</b> : null}</button>{notificationsOpen ? <div className="admin-notifications__panel"><div><strong>Notifications</strong><small>Contact form activity</small></div>{notifications.length ? notifications.slice(0, 4).map((item) => <Link key={item.id} href="/caautobodyadmin/contacts" onClick={() => setNotificationsOpen(false)}><CircleRounded fontSize="inherit" /><span><b>New enquiry from {item.name}</b><small>{item.service}</small></span></Link>) : <p>No contact notifications yet.</p>}</div> : null}</div><div className="admin-profile" ref={profileRef}><button className="admin-profile__trigger" type="button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} aria-haspopup="menu" aria-expanded={profileOpen}><b>{viewer?.email.slice(0, 2).toUpperCase() || "CA"}</b><span>{viewer?.role || "CMS access"}<small>{viewer?.email || "Verifying session"}</small></span><ExpandMoreRounded className={profileOpen ? "is-open" : ""} fontSize="small" /></button>{profileOpen ? <div className="admin-profile__menu" role="menu"><p><strong>{viewer?.email || "CMS account"}</strong><small>{viewer?.role || "CMS access"}</small></p><button type="button" role="menuitem" onClick={() => void signOut()}><LogoutRounded fontSize="small" />Sign out</button></div> : null}</div></div></header>
      <main className="admin-content">{children}</main>
    </div>
    {open ? <button aria-label="Close menu" className="admin-backdrop" onClick={() => setOpen(false)} /> : null}
  </div>;
}

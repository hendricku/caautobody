"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import CollectionsOutlined from "@mui/icons-material/CollectionsOutlined";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import AnalyticsOutlined from "@mui/icons-material/AnalyticsOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import MenuRounded from "@mui/icons-material/MenuRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import ContactMailOutlined from "@mui/icons-material/ContactMailOutlined";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import CircleRounded from "@mui/icons-material/CircleRounded";
import { contactMockEvent, getContactEnquiries, markContactNotificationsRead, type ContactEnquiry } from "@/lib/contactMock";

const links = [
  ["Dashboard", "/caautobodyadmin/dashboard", DashboardRounded],
  ["Blogs", "/caautobodyadmin/blogs", ArticleOutlined],
  ["Services", "/caautobodyadmin/services", BuildOutlined],
  ["Gallery", "/caautobodyadmin/gallery", CollectionsOutlined],
  ["FAQ", "/caautobodyadmin/faq", QuizOutlined],
  ["Contact management", "/caautobodyadmin/contacts", ContactMailOutlined],
  ["Analytics", "/caautobodyadmin/analytics", AnalyticsOutlined],
  ["Team & access", "/caautobodyadmin/team", GroupOutlined],
  ["Settings", "/caautobodyadmin/settings", SettingsOutlined],
] as const;

type Viewer = { username: string; full_name: string };

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ContactEnquiry[]>([]);
  const viewer: Viewer = { username: "caadmin", full_name: "CA Autobody Admin" };

  useEffect(() => {
    const refresh = () => setNotifications(getContactEnquiries());
    refresh();
    window.addEventListener(contactMockEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(contactMockEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const unreadCount = notifications.filter((item) => !item.notificationRead).length;

  function toggleNotifications() {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next && unreadCount) markContactNotificationsRead();
  }

  async function signOut() {
    router.replace("/caautobodyadmin/login");
    router.refresh();
  }

  return <div className={`admin-root ${collapsed ? "admin-root--collapsed" : ""}`}>
    <aside className={`admin-sidebar ${open ? "open" : ""}`}>
      <div className="admin-brand"><img src="https://caautobody.com.au/wp-content/uploads/2021/05/logo.png" alt="CA Chelsea Autobody" /><span>Website Admin<small>Content workspace</small></span><button className="admin-sidebar__toggle" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <MenuRounded fontSize="small" /> : <ChevronLeftRounded fontSize="small" />}</button></div>
      <nav>{links.map(([label, href, Icon]) => <Link key={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""} href={href} onClick={() => setOpen(false)} title={collapsed ? label : undefined}><Icon fontSize="small" /><span>{label}</span></Link>)}</nav>
      <div className="admin-sidebar__foot"><Link href="/" target="_blank"><OpenInNewRounded fontSize="small" /><span>View website</span></Link><button type="button" onClick={signOut}><LogoutRounded fontSize="small" /><span>Sign out</span></button></div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar"><button type="button" className="admin-menu" onClick={() => setOpen((value) => !value)} aria-label="Open menu"><MenuRounded fontSize="small" /></button><div><span>CA Autobody</span><small>Content &amp; administration</small></div><div className="admin-topbar__actions"><div className="admin-notifications"><button className="admin-icon-button" type="button" onClick={toggleNotifications} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={notificationsOpen}><NotificationsNoneRounded fontSize="small" />{unreadCount ? <b>{unreadCount > 9 ? "9+" : unreadCount}</b> : null}</button>{notificationsOpen ? <div className="admin-notifications__panel"><div><strong>Notifications</strong><small>Contact form activity</small></div>{notifications.length ? notifications.slice(0, 4).map((item) => <Link key={item.id} href="/caautobodyadmin/contacts" onClick={() => setNotificationsOpen(false)}><CircleRounded fontSize="inherit" /><span><b>New enquiry from {item.name}</b><small>{item.service}</small></span></Link>) : <p>No contact notifications yet.</p>}</div> : null}</div><div className="admin-user"><b>{viewer?.username.slice(0, 2).toUpperCase() || "CA"}</b><span>{viewer?.full_name || "Administrator"}<small>@{viewer?.username || "admin"}</small></span></div></div></header>
      <main className="admin-content">{children}</main>
    </div>
    {open ? <button aria-label="Close menu" className="admin-backdrop" onClick={() => setOpen(false)} /> : null}
  </div>;
}

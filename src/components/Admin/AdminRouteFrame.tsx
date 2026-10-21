"use client";

import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

export default function AdminRouteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/caautobodyadmin/login" || pathname === "/caautobodyadmin/verify" || pathname.endsWith("/preview")) return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}

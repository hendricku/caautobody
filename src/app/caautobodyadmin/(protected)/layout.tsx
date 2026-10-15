import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/cms/admin-server";
export const dynamic = "force-dynamic";
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/caautobodyadmin/login");
  return <>{children}</>;
}

import { getAdmin } from "@/lib/cms/admin-server";
import AdminTeamAccess from "@/components/Admin/AdminTeamAccess";

export default async function TeamPage() {
  const admin = await getAdmin();
  if (!admin || admin.role !== "admin") {
    return <section className="admin-panel"><h1>Administrator access required</h1><p>Ask an administrator to manage team access.</p></section>;
  }
  return <AdminTeamAccess />;
}

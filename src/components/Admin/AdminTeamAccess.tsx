"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import Swal from "sweetalert2";
import type { TeamAction, TeamMember } from "@/lib/cms/team-management";

const dates = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" });
const roleLabels = { admin: "Administrator", editor: "Editor", publisher: "Publisher" };

export default function AdminTeamAccess() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [viewerId, setViewerId] = useState("");
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/members", { cache: "no-store", signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The team could not be loaded.");
      if (version === requestVersion.current && !signal?.aborted) { setMembers(result.members); setViewerId(result.viewerId); }
    } catch (reason) { if (version === requestVersion.current && !signal?.aborted) setError(reason instanceof Error ? reason.message : "The team could not be loaded."); }
    finally { if (version === requestVersion.current && !signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  async function mutate(action: TeamAction, member?: TeamMember) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/members", {
        method: action === "add" ? "POST" : action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "add" ? { email } : action === "delete" ? { userId: member?.user_id } : { userId: member?.user_id, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "This change could not be saved.");
      if (action === "add") setEmail("");
      await load();
      await Swal.fire({ icon: "success", title: ({ add: "Administrator added", deactivate: "Access deactivated", reactivate: "Access restored", delete: "Member removed" })[action],
        text: action === "add" ? "They can now sign in with their email and request a one-time code." : action === "reactivate" ? "This person must request a new sign-in code to access the dashboard." : undefined,
        confirmButtonColor: "#8a6428" });
    } catch (reason) { await Swal.fire({ icon: "error", title: "Change not saved", text: reason instanceof Error ? reason.message : "Please try again.", confirmButtonColor: "#8a6428" }); }
    finally { setBusy(false); }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const confirmation = await Swal.fire({ icon: "question", title: "Add an administrator?", text: `${email.trim()} will be able to manage website content and team access.`, showCancelButton: true, confirmButtonText: "Add administrator", confirmButtonColor: "#8a6428" });
    if (confirmation.isConfirmed) await mutate("add");
  }

  async function change(action: Exclude<TeamAction, "add">, member: TeamMember) {
    const confirmation = await Swal.fire({ icon: "warning", title: action === "delete" ? "Remove this member?" : action === "deactivate" ? "Deactivate this account?" : "Restore this account?",
      text: action === "delete" ? `${member.email} will lose dashboard access and be removed from this list. Their content and audit history will be kept.` : action === "deactivate" ? `${member.email} will lose dashboard access until reactivated.` : `${member.email} will be able to request a new sign-in code.`,
      showCancelButton: true, focusCancel: action !== "reactivate", confirmButtonText: action === "delete" ? "Remove member" : action === "deactivate" ? "Deactivate" : "Reactivate", confirmButtonColor: action === "reactivate" ? "#8a6428" : "#9d3c36" });
    if (confirmation.isConfirmed) await mutate(action, member);
  }

  const visible = members.filter((member) => member.email.toLowerCase().includes(search.trim().toLowerCase()) && (status === "all" || member.active === (status === "active")));
  const disabled = busy || loading || Boolean(error);

  return <div className="admin-team">
    <div className="admin-page-head"><div><h1>Team &amp; access</h1><p>Manage who can access your website dashboard.</p></div></div>
    <section className="admin-panel admin-team__add" aria-labelledby="add-admin-heading">
      <div><PersonAddOutlined aria-hidden="true" /><h2 id="add-admin-heading">Add an administrator</h2><p>Administrators can manage all website content and team access. Add someone you trust.</p></div>
      <form onSubmit={(event) => void add(event)}><label htmlFor="admin-team-email">Email address</label><div><input id="admin-team-email" type="email" autoComplete="email" maxLength={254} placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={disabled} aria-describedby="admin-team-login-note" /><button type="submit" className="admin-primary" disabled={disabled}>{busy ? "Saving..." : "Add admin"}</button></div><p id="admin-team-login-note">They can sign in using an email code. No password needed.</p></form>
    </section>
    <section className="admin-panel admin-team__directory" aria-labelledby="team-directory-heading" aria-busy={loading}>
      <div className="panel-head"><div><h2 id="team-directory-heading">Team members</h2><p>{members.filter((member) => member.active).length} active · {members.filter((member) => !member.active).length} inactive</p></div><button type="button" className="admin-team__refresh" onClick={() => void load()} disabled={busy || loading}><RefreshRounded fontSize="small" />Refresh</button></div>
      <div className="admin-team__filters"><label>Search team<input type="search" placeholder="Search by email" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All accounts</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div>
      {error ? <div className="admin-team__error" role="alert"><strong>Team unavailable</strong><p>{error}</p></div> : null}
      {loading ? <p className="admin-note" role="status">Loading team members...</p> : null}
      {!loading && !error ? <><table className="admin-team__table"><thead><tr><th scope="col">Member</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Last sign-in</th><th scope="col">Actions</th></tr></thead><tbody>{visible.map((member) => <tr key={member.user_id}>
        <td data-label="Member"><strong>{member.email}</strong>{member.user_id === viewerId ? <span className="admin-team__you">You</span> : null}<small>Added {dates.format(new Date(member.created_at))}</small></td>
        <td data-label="Role">{roleLabels[member.role]}</td><td data-label="Status"><span className={`admin-team__status ${member.active ? "is-active" : ""}`}>{member.active ? "Active" : "Inactive"}</span></td>
        <td data-label="Last sign-in">{member.last_sign_in_at ? <time dateTime={member.last_sign_in_at}>{dates.format(new Date(member.last_sign_in_at))}</time> : "Not yet signed in"}</td>
        <td data-label="Actions">{member.user_id === viewerId ? <span className="admin-team__own">Your account</span> : <div className="admin-team__actions"><button type="button" disabled={disabled} onClick={() => void change(member.active ? "deactivate" : "reactivate", member)} aria-label={`${member.active ? "Deactivate" : "Reactivate"} ${member.email}`}>{member.active ? "Deactivate" : "Reactivate"}</button><button type="button" className="is-destructive" disabled={disabled} onClick={() => void change("delete", member)} aria-label={`Remove ${member.email}`}>Remove</button></div>}</td>
      </tr>)}</tbody></table>{!visible.length ? <p className="admin-note">{members.length ? "No team members match your filters." : "No team members found."}</p> : null}</> : null}
    </section>
    <p className="admin-team__footnote">Deactivated accounts can be restored. Removing a member keeps their website content and audit history.</p>
  </div>;
}

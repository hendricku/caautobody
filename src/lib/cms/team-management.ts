import type { SupabaseClient } from "@supabase/supabase-js";

export type TeamAction = "add" | "deactivate" | "reactivate" | "delete";
export type TeamMember = {
  user_id: string;
  email: string;
  role: "admin" | "editor" | "publisher";
  active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

export class TeamError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export function teamDatabaseError(code?: string): TeamError {
  if (code === "42501") return new TeamError("Administrator access is required.", 403);
  if (code === "23505") return new TeamError("This email already belongs to the team. Reactivate the existing account if needed.", 409);
  if (code === "P0002") return new TeamError("This team member no longer exists. Refresh the team list.", 404);
  if (code === "23514") return new TeamError("You cannot remove your own access or the last active administrator.", 409);
  if (code === "22023") return new TeamError("Check the email address and requested action.", 400);
  return new TeamError("Team management is temporarily unavailable. Please try again.", 503);
}

/** Authorization and membership/audit writes run together in the caller's database session. */
export async function manageTeamMember(
  caller: SupabaseClient,
  identities: SupabaseClient,
  input: { action: TeamAction; email?: string; userId?: string },
): Promise<void> {
  const parameters = { p_action: input.action, p_email: input.email || null, p_user_id: input.userId || null };
  const first = await caller.rpc("cms_manage_team_member", parameters);
  if (first.error) throw teamDatabaseError(first.error.code);
  if (!first.data?.identity_required) return;
  if (input.action !== "add" || !input.email) throw teamDatabaseError();

  // No password or mail is created here. The mailbox owner must still prove ownership through OTP.
  const { error } = await identities.auth.admin.createUser({ email: input.email, email_confirm: true });
  if (error && !["email_exists", "user_already_exists"].includes(error.code || "")) {
    throw new TeamError("The admin account could not be created. Please try again.", 503);
  }
  // A failed membership transaction leaves no CMS privileges. Retrying safely reuses
  // the identity; never delete an identity another concurrent request may have reused.
  const completed = await caller.rpc("cms_manage_team_member", parameters);
  if (completed.error) throw teamDatabaseError(completed.error.code);
  if (completed.data?.identity_required) throw teamDatabaseError();
}

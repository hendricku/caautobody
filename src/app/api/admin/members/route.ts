import { NextRequest, NextResponse } from "next/server";
import { getAdmin, sameOrigin } from "@/lib/cms/admin-server";
import { serviceClient } from "@/lib/cms/service-client";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";
import { manageTeamMember, TeamError, teamDatabaseError } from "@/lib/cms/team-management";
import { addAdminSchema, changeMemberSchema, removeMemberSchema } from "@/lib/cms/team-validation";

export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: privateHeaders });

async function administrator(request: NextRequest, write: boolean) {
  if (write && !sameOrigin(request)) throw new TeamError("Invalid request origin.", 403);
  const admin = await getAdmin();
  if (!admin) throw new TeamError("Please sign in to continue.", 401);
  if (admin.role !== "admin") throw new TeamError("Administrator access is required.", 403);
  const allowed = await consumePublicRateLimit({ request, identity: admin.user.id, identityOnly: true,
    scope: write ? "admin-team-write" : "admin-team-read", limit: write ? 15 : 60, windowSeconds: write ? 900 : 300 });
  if (!allowed) throw new TeamError("Too many requests. Please wait before trying again.", 429);
  return admin;
}

function failure(error: unknown) {
  if (error instanceof TeamError) return json({ error: error.message }, error.status);
  return json({ error: "Team management is temporarily unavailable. Please try again." }, 503);
}

async function body(request: NextRequest) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new TeamError("Send the form as JSON.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new TeamError("Check the form and try again.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > 2048) { await reader.cancel(); throw new TeamError("The request is too large.", 413); }
    chunks.push(next.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }
  catch { throw new TeamError("Check the form and try again.", 400); }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await administrator(request, false);
    const { data, error } = await admin.client.rpc("cms_list_team_members");
    if (error) throw teamDatabaseError(error.code);
    return json({ members: data || [], viewerId: admin.user.id });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await administrator(request, true);
    const input = addAdminSchema.safeParse(await body(request));
    if (!input.success) return json({ error: "Enter a valid email address." }, 400);
    await manageTeamMember(admin.client, serviceClient(), { action: "add", email: input.data.email });
    return json({ ok: true }, 201);
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await administrator(request, true);
    const input = changeMemberSchema.safeParse(await body(request));
    if (!input.success) return json({ error: "Select a valid member and action." }, 400);
    await manageTeamMember(admin.client, serviceClient(), input.data);
    return json({ ok: true });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await administrator(request, true);
    const input = removeMemberSchema.safeParse(await body(request));
    if (!input.success) return json({ error: "Select a valid team member." }, 400);
    await manageTeamMember(admin.client, serviceClient(), { action: "delete", userId: input.data.userId });
    return json({ ok: true });
  } catch (error) { return failure(error); }
}

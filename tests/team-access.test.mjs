import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";

const require = createRequire(import.meta.url);
function sourceModule(path, mocks = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", outputText)((id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id), loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const { manageTeamMember, TeamError } = sourceModule("src/lib/cms/team-management.ts");
const validation = sourceModule("src/lib/cms/team-validation.ts");
const ids = { admin: "00000000-0000-4000-8000-000000000001", other: "00000000-0000-4000-8000-000000000002", editor: "00000000-0000-4000-8000-000000000003", outsider: "00000000-0000-4000-8000-000000000004" };
const sessions = { admin: "10000000-0000-4000-8000-000000000001", other: "10000000-0000-4000-8000-000000000002", editor: "10000000-0000-4000-8000-000000000003", outsider: "10000000-0000-4000-8000-000000000004" };
const migration = readFileSync(new URL("../supabase/migrations/20261017025958_secure_team_management.sql", import.meta.url), "utf8");

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.jwt(), auth.uid() to anon, authenticated, service_role;
    create table auth.users(id uuid primary key, email text, deleted_at timestamptz, last_sign_in_at timestamptz);
    create table auth.sessions(id uuid primary key, user_id uuid, created_at timestamptz not null default now());
    create table public.cms_admin_members(user_id uuid primary key references auth.users(id), role text not null check(role in ('admin','editor','publisher')), active boolean not null default true, created_at timestamptz not null default now());
    alter table public.cms_admin_members enable row level security;
    grant select on public.cms_admin_members to authenticated;
    create table public.cms_audit_log(id bigint generated always as identity primary key,actor_id uuid,actor_email text,table_name text,record_id text,operation text,old_status text,new_status text,created_at timestamptz default now());
    alter table public.cms_audit_log enable row level security;
  `);
  for (const [name, id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id,email) values ($1,$2)", [id, `${name}@example.com`]);
    await db.query("insert into auth.sessions(id,user_id,created_at) values ($1,$2,now()-interval '1 hour')", [sessions[name], id]);
    if (name !== "outsider") await db.query("insert into public.cms_admin_members(user_id,role) values ($1,$2)", [id, name === "editor" ? "editor" : "admin"]);
  }
  await db.exec(migration);
  return db;
}
async function asUser(db, name, session = sessions[name]) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify(name ? { sub: ids[name], session_id: session, email: `${name}@example.com` } : {})]);
  await db.exec(`set role ${name ? "authenticated" : "anon"}`);
}
const result = async (db, sql, args = []) => (await db.query(sql, args)).rows[0];

test("email validation normalizes input and rejects privilege fields", () => {
  assert.deepEqual(validation.addAdminSchema.parse({ email: " ADMIN@EXAMPLE.COM " }), { email: "admin@example.com" });
  assert.equal(validation.addAdminSchema.safeParse({ email: "admin@example.com", role: "admin", active: true }).success, false);
  assert.equal(validation.addAdminSchema.safeParse({ email: { $ne: null } }).success, false);
  assert.equal(validation.changeMemberSchema.safeParse({ userId: ids.other, action: "promote" }).success, false);
  assert.equal(validation.removeMemberSchema.safeParse({ userId: "not-a-user" }).success, false);
  assert.equal(validation.startAdminLoginSchema.safeParse(null).success, false);
  assert.equal(validation.verifyAdminLoginSchema.safeParse({ email: "admin@example.com", code: "1234567" }).success, false);
});

test("existing identity gains membership without creating a second Auth account", async () => {
  let created = false;
  const caller = { rpc: async () => ({ data: { ok: true }, error: null }) };
  const identities = { auth: { admin: { createUser: async () => { created = true; } } } };
  await manageTeamMember(caller, identities, { action: "add", email: "staff@example.com" });
  assert.equal(created, false);
});

test("new Auth identity is provisioned only after administrator authorization", async () => {
  let calls = 0;
  let created;
  const caller = { rpc: async () => ({ data: ++calls === 1 ? { identity_required: true } : { ok: true }, error: null }) };
  const identities = { auth: { admin: { createUser: async (attributes) => { created = attributes; return { error: null }; } } } };
  await manageTeamMember(caller, identities, { action: "add", email: "staff@example.com" });
  assert.deepEqual(created, { email: "staff@example.com", email_confirm: true });
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(manageTeamMember({ rpc: async () => ({ error: { code: "42501" } }) }, { auth: { admin: { createUser: () => calls++ } } }, { action: "add", email: "bad@example.com" }), (error) => error instanceof TeamError && error.status === 403);
  assert.equal(calls, 0);
});

test("database errors are mapped to safe messages and failed membership grants stay failed", async () => {
  let calls = 0;
  const caller = { rpc: async () => ++calls === 1 ? { data: { identity_required: true } } : { error: { code: "XX000", message: "private database details" } } };
  const identities = { auth: { admin: { createUser: async () => ({ error: null }) } } };
  await assert.rejects(manageTeamMember(caller, identities, { action: "add", email: "staff@example.com" }), (error) => error.status === 503 && !error.message.includes("private"));
});

test("SQL permissions reject anonymous, editor, outsider and direct membership writes", async () => {
  const db = await database();
  try {
    await asUser(db, null);
    await assert.rejects(db.query("select public.cms_list_team_members()"), /permission denied/);
    for (const name of ["editor", "outsider"]) {
      await asUser(db, name);
      await assert.rejects(db.query("select public.cms_list_team_members()"), /Administrator required/);
      await assert.rejects(db.query("select public.cms_manage_team_member('delete', null, $1)", [ids.admin]), /Administrator required/);
      await assert.rejects(db.query("insert into public.cms_admin_members(user_id,role) values ($1,'admin')", [ids.outsider]), /permission denied/);
    }
    await asUser(db, "admin");
    await assert.rejects(db.query("select public.cms_can_request_admin_otp('other@example.com')"), /permission denied/);
  } finally { await db.close(); }
});

test("SQL team directory includes email and records add/deactivate/reactivate/remove", async () => {
  const db = await database();
  try {
    await asUser(db, "admin");
    const directory = (await result(db, "select public.cms_list_team_members() as members")).members;
    assert.equal(directory.length, 3);
    assert.ok(directory.some((member) => member.email === "other@example.com"));
    await db.query("select public.cms_manage_team_member('add', 'outsider@example.com', null)");
    await assert.rejects(db.query("select public.cms_manage_team_member('add', 'outsider@example.com', null)"), /Member already exists/);
    await db.query("select public.cms_manage_team_member('deactivate', null, $1)", [ids.outsider]);
    await db.query("select public.cms_manage_team_member('reactivate', null, $1)", [ids.outsider]);
    await db.query("select public.cms_manage_team_member('delete', null, $1)", [ids.outsider]);
    await db.exec("reset role");
    assert.deepEqual((await db.query("select operation from public.cms_audit_log order by id")).rows.map((row) => row.operation), ["INSERT", "DEACTIVATE", "REACTIVATE", "DELETE"]);
    assert.equal((await result(db, "select count(*)::int as n from auth.users where id=$1", [ids.outsider])).n, 1);
    assert.equal((await result(db, "select count(*)::int as n from public.cms_admin_members where user_id=$1", [ids.outsider])).n, 0);
  } finally { await db.close(); }
});

test("old sessions cannot regain access after deactivate/reactivate or delete/re-add", async () => {
  const db = await database();
  try {
    await asUser(db, "admin");
    await db.query("select public.cms_manage_team_member('deactivate', null, $1)", [ids.other]);
    await asUser(db, "other");
    assert.equal((await result(db, "select public.cms_staff_role() as role")).role, null);
    await assert.rejects(db.query("select public.cms_manage_team_member('deactivate', null, $1)", [ids.admin]), /Administrator required/);
    await asUser(db, "admin");
    await db.query("select public.cms_manage_team_member('reactivate', null, $1)", [ids.other]);
    await asUser(db, "other");
    assert.equal((await result(db, "select public.cms_staff_role() as role")).role, null);
    await db.exec("reset role");
    const fresh = "20000000-0000-4000-8000-000000000002";
    await db.query("insert into auth.sessions(id,user_id) values ($1,$2)", [fresh, ids.other]);
    await asUser(db, "other", fresh);
    assert.equal((await result(db, "select public.cms_staff_role() as role")).role, "admin");
    await asUser(db, "admin");
    await db.query("select public.cms_manage_team_member('delete', null, $1)", [ids.other]);
    await db.query("select public.cms_manage_team_member('add', 'other@example.com', null)");
    await asUser(db, "other", fresh);
    assert.equal((await result(db, "select public.cms_staff_role() as role")).role, null);
  } finally { await db.close(); }
});

test("self-removal is denied and an audit failure rolls the access change back", async () => {
  const db = await database();
  try {
    await asUser(db, "admin");
    for (const action of ["deactivate", "delete"]) await assert.rejects(db.query("select public.cms_manage_team_member($1,null,$2)", [action, ids.admin]), /Cannot change own access/);
    await db.exec("reset role; alter table public.cms_audit_log add constraint test_reject_audit check (false)");
    await asUser(db, "admin");
    await assert.rejects(db.query("select public.cms_manage_team_member('deactivate',null,$1)", [ids.other]), /test_reject_audit/);
    await db.exec("reset role");
    assert.equal((await result(db, "select active from public.cms_admin_members where user_id=$1", [ids.other])).active, true);
  } finally { await db.close(); }
});

test("OTP eligibility excludes inactive/removed accounts and is server-only", async () => {
  const db = await database();
  try {
    await asUser(db, "admin");
    await db.query("select public.cms_manage_team_member('deactivate',null,$1)", [ids.other]);
    await db.exec("reset role; set role service_role");
    assert.equal((await result(db, "select public.cms_can_request_admin_otp('admin@example.com') as allowed")).allowed, true);
    for (const email of ["other@example.com", "outsider@example.com", "unknown@example.com"]) {
      assert.equal((await result(db, "select public.cms_can_request_admin_otp($1) as allowed", [email])).allowed, false);
    }
  } finally { await db.close(); }
});

test("OTP delivery sends the Supabase code only to an active member and never returns it", async () => {
  let allowed = false;
  let generated = 0;
  const delivered = [];
  const { deliverAdminOtp } = sourceModule("src/lib/cms/admin-otp.ts", {
    "server-only": {},
    "@/lib/cms/service-client": {},
    "@/lib/cms/admin-server": {},
    "@/lib/email/admin-otp": { sendAdminOtpEmail: async (...args) => delivered.push(args) },
  });
  const database = { rpc: async () => ({ data: allowed, error: null }), auth: { admin: { generateLink: async () => { generated++; return { data: { properties: { email_otp: "123456" } }, error: null }; } } } };
  assert.equal(await deliverAdminOtp("other@example.com", database), undefined);
  assert.equal(generated, 0);
  allowed = true;
  assert.equal(await deliverAdminOtp("admin@example.com", database), undefined);
  assert.deepEqual(delivered, [["admin@example.com", "123456"]]);
  const broken = { ...database, rpc: async () => ({ error: { message: "private error" } }) };
  await assert.rejects(deliverAdminOtp("admin@example.com", broken), /Admin login is unavailable/);
});

test("OTP request response is uniform for unknown email and mail failures", async () => {
  const { NextResponse } = require("next/server");
  let failMail = false;
  const { POST } = sourceModule("src/app/api/admin/auth/start/route.ts", {
    "next/server": { NextResponse, after: (callback) => { void callback(); } },
    "@/lib/cms/admin-server": { sameOrigin: () => true },
    "@/lib/cms/team-validation": validation,
    "@/lib/security/public-rate-limit": { consumePublicRateLimit: async () => true },
    "@/lib/cms/admin-otp": { deliverAdminOtp: async () => { if (failMail) throw Error("private mail error"); } },
  });
  const request = () => new Request("http://localhost/api/admin/auth/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "admin@example.com" }) });
  const first = await POST(request());
  failMail = true;
  const second = await POST(request());
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(await first.json(), await second.json());
});

test("member API enforces authentication, admin role, CSRF, throttling and strict bodies", async () => {
  const { NextResponse } = require("next/server");
  let user = null;
  let originAllowed = true;
  let rateAllowed = true;
  const writes = [];
  const endpoints = sourceModule("src/app/api/admin/members/route.ts", {
    "next/server": { NextResponse },
    "@/lib/cms/admin-server": { getAdmin: async () => user, sameOrigin: () => originAllowed },
    "@/lib/cms/service-client": { serviceClient: () => ({}) },
    "@/lib/cms/team-management": { TeamError, teamDatabaseError: () => new TeamError("Unavailable", 503), manageTeamMember: async (...args) => writes.push(args[2]) },
    "@/lib/cms/team-validation": validation,
    "@/lib/security/public-rate-limit": { consumePublicRateLimit: async () => rateAllowed },
  });
  const request = (method, body) => new Request("http://localhost/api/admin/members", { method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) assert.equal((await endpoints[method](request(method, method === "GET" ? undefined : {}))).status, 401);
  user = { user: { id: ids.editor }, role: "editor" };
  assert.equal((await endpoints.POST(request("POST", { email: "staff@example.com" }))).status, 403);
  user = { user: { id: ids.admin }, role: "admin", client: { rpc: async () => ({ data: [], error: null }) } };
  originAllowed = false;
  assert.equal((await endpoints.DELETE(request("DELETE", { userId: ids.other }))).status, 403);
  originAllowed = true;
  rateAllowed = false;
  assert.equal((await endpoints.POST(request("POST", { email: "staff@example.com" }))).status, 429);
  rateAllowed = true;
  for (const body of [null, { email: "staff@example.com", role: "admin" }, { email: "invalid" }]) assert.equal((await endpoints.POST(request("POST", body))).status, 400);
  assert.equal((await endpoints.POST(request("POST", { email: "x".repeat(3000) }))).status, 413);
  assert.equal(writes.length, 0);
  assert.equal((await endpoints.POST(request("POST", { email: " Staff@Example.com " }))).status, 201);
  assert.deepEqual(writes, [{ action: "add", email: "staff@example.com" }]);
  assert.equal((await endpoints.PATCH(request("PATCH", { userId: ids.other, action: "deactivate" }))).status, 200);
  assert.equal((await endpoints.DELETE(request("DELETE", { userId: ids.other }))).status, 200);
  const list = await endpoints.GET(request("GET"));
  assert.equal(list.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(await list.json(), { members: [], viewerId: ids.admin });
});

test("existing OTP login remains available only while the new RPC is missing", async () => {
  const attempts = [];
  const { deliverAdminOtp } = sourceModule("src/lib/cms/admin-otp.ts", {
    "server-only": {},
    "@/lib/cms/service-client": {},
    "@/lib/email/admin-otp": {},
    "@/lib/cms/admin-server": { supabaseForToken: () => ({ auth: { signInWithOtp: async (input) => { attempts.push(input); return { error: null }; } } }) },
  });
  await deliverAdminOtp("admin@example.com", { rpc: async () => ({ error: { code: "PGRST202" } }) });
  assert.deepEqual(attempts, [{ email: "admin@example.com", options: { shouldCreateUser: false } }]);
  await assert.rejects(deliverAdminOtp("admin@example.com", { rpc: async () => ({ error: { code: "42501" } }) }));
  assert.equal(attempts.length, 1);
});

test("Resend admin email contains a readable code and rejects HTML in place of a code", async () => {
  const savedKey = process.env.RESEND_API_KEY;
  const savedFrom = process.env.RESEND_FROM_EMAIL;
  process.env.RESEND_API_KEY = "re_test_placeholder";
  process.env.RESEND_FROM_EMAIL = "notifications@example.com";
  let sent;
  try {
    const { sendAdminOtpEmail } = sourceModule("src/lib/email/admin-otp.ts", {
      "server-only": {},
      resend: { Resend: class { emails = { send: async (message) => { sent = message; return { error: null }; } }; } },
    });
    await sendAdminOtpEmail("admin@example.com", "123456");
    assert.deepEqual(sent.to, ["admin@example.com"]);
    assert.match(sent.text, /123456/);
    assert.match(sent.html, />123456</);
    sent = undefined;
    await assert.rejects(sendAdminOtpEmail("admin@example.com", "<img>"));
    assert.equal(sent, undefined);
  } finally {
    if (savedKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = savedKey;
    if (savedFrom === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = savedFrom;
  }
});

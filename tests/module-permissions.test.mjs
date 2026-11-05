import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const migration = readFileSync(new URL("../supabase/migrations/20261105041806_module_permissions.sql", import.meta.url), "utf8");
const ids = { admin: "00000000-0000-4000-8000-000000000001", member: "00000000-0000-4000-8000-000000000002" };
async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.user',true),'')::uuid $$;
    grant usage on schema auth,storage to authenticated;
    grant execute on function auth.uid() to authenticated;
    create table auth.users(id uuid primary key,email text,deleted_at timestamptz,last_sign_in_at timestamptz);
    create table public.cms_admin_members(user_id uuid primary key, role text, active boolean, access_after timestamptz default now(), created_at timestamptz default now());
    create table public.cms_audit_log(actor_id uuid, table_name text, record_id text, operation text, old_status text, new_status text);
    create function public.cms_staff_role() returns text language sql stable security definer set search_path = '' as $$ select role from public.cms_admin_members where user_id=auth.uid() and active $$;
    grant execute on function public.cms_staff_role() to authenticated;
    create table storage.objects(bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert on storage.objects to authenticated;
    create policy allow_storage on storage.objects to authenticated using(true) with check(true);
    create table public.cms_services(id int,slug text,content_json jsonb,status text);
    create table public.cms_blog_posts(id int,status text);
    create table public.cms_locations(id int,status text);
    create table public.cms_offers(id int,status text);
    create table public.cms_faqs(id int,status text);
    create table public.cms_gallery_items(id int,status text);
    create table public.cms_page_sections(id int,status text);
    create table public.cms_site_settings(id int);
    create table public.cms_enquiries(id int);
    do $$ declare t text; begin
      foreach t in array array['cms_services','cms_blog_posts','cms_locations','cms_offers','cms_faqs','cms_gallery_items','cms_page_sections','cms_site_settings','cms_enquiries'] loop
        execute format('alter table public.%I enable row level security',t);
        execute format('grant select,insert,update on public.%I to authenticated',t);
        execute format('create policy allow_staff on public.%I to authenticated using(true) with check(true)',t);
      end loop;
    end $$;
  `);
  await db.query("insert into auth.users(id,email) values ($1,'admin@example.com'),($2,'member@example.com')", [ids.admin, ids.member]);
  await db.query("insert into public.cms_admin_members(user_id,role,active) values($1,'admin',true),($2,'publisher',true)", [ids.admin,ids.member]);
  await db.exec(migration);
  await db.exec("insert into public.cms_blog_posts values(1,'draft'); insert into public.cms_offers values(1,'draft'); insert into public.cms_services values(1,'ordinary','{}','draft'),(2,'brand',jsonb_build_object('variant','brand'),'draft');");
  return db;
}
async function asUser(db, id) { await db.exec("reset role"); await db.query("select set_config('test.user',$1,false)", [id]); await db.exec("set role authenticated"); }

test("module permissions protect reads and writes and cannot be self-escalated", async () => {
  const db = await database();
  try {
    await asUser(db, ids.admin);
    await db.query("select public.cms_set_member_modules($1,array['blogs'])", [ids.member]);
    await asUser(db, ids.member);
    assert.equal((await db.query("select * from public.cms_blog_posts")).rows.length, 1);
    assert.equal((await db.query("select * from public.cms_offers")).rows.length, 0);
    assert.equal((await db.query("select * from public.cms_services")).rows.length, 0);
    await assert.rejects(db.query("insert into public.cms_offers values(2,'draft')"), /row-level security/);
    await assert.rejects(db.query("select public.cms_set_member_modules($1,null)", [ids.member]), /Administrator required/);
    await asUser(db, ids.admin);
    await db.query("select public.cms_set_member_modules($1,array['brands'])", [ids.member]);
    await asUser(db, ids.member);
    assert.deepEqual((await db.query("select slug from public.cms_services")).rows.map((x) => x.slug), ["brand"]);
    await assert.rejects(db.query("update public.cms_services set content_json='{}' where slug='brand'"), /row-level security/);
  } finally { await db.close(); }
});

test("existing administrators retain access and changes are audited", async () => {
  const db = await database();
  try {
    await asUser(db, ids.admin);
    assert.equal((await db.query("select * from public.cms_offers")).rows.length, 1);
    await assert.rejects(db.query("select public.cms_set_member_modules($1,array['blogs'])", [ids.admin]), /Cannot change own access/);
    await db.query("select public.cms_set_member_modules($1,array['blogs'])", [ids.member]);
    await db.exec("reset role");
    assert.equal((await db.query("select * from public.cms_audit_log")).rows.length, 1);
  } finally { await db.close(); }
});

test("limited members can be created only by an administrator", async () => {
  const db = await database();
  try {
    await asUser(db, ids.admin);
    const result = await db.query("select public.cms_add_limited_member('new@example.com',array['blogs']) as result");
    assert.equal(result.rows[0].result.identity_required, true);
    await db.exec("reset role");
    await db.query("insert into auth.users(id,email) values($1,'new@example.com')", ["00000000-0000-4000-8000-000000000003"]);
    await asUser(db, ids.admin);
    await db.query("select public.cms_add_limited_member('new@example.com',array['blogs'])");
    await db.query("select public.cms_set_member_modules($1,array['blogs'])", [ids.member]);
    await asUser(db, ids.member);
    await assert.rejects(db.query("select public.cms_add_limited_member('attacker@example.com',array['blogs'])"), /Administrator required/);
    await assert.rejects(db.query("select public.cms_set_member_modules($1,null)", [ids.admin]), /Administrator required/);
    await db.exec("reset role");
    const created = await db.query("select role,modules from public.cms_admin_members where user_id=$1", ["00000000-0000-4000-8000-000000000003"]);
    assert.equal(created.rows[0].role, "publisher");
    assert.deepEqual(created.rows[0].modules, ["blogs"]);
  } finally { await db.close(); }
});

test("restricted members cannot read or upload another user's staged images", async () => {
  const db = await database();
  try {
    await db.query("insert into storage.objects values('cms-staging',$1),('cms-staging',$2)", [ids.admin + "/a.webp", ids.member + "/b.webp"]);
    await asUser(db, ids.admin);
    await db.query("select public.cms_set_member_modules($1,array['blogs'])", [ids.member]);
    await asUser(db, ids.member);
    const result = await db.query("select name from storage.objects");
    assert.deepEqual(result.rows.map((row) => row.name), [ids.member + "/b.webp"]);
    await assert.rejects(db.query("insert into storage.objects values('cms-staging',$1)", [ids.admin + "/c.webp"]), /row-level security/);
  } finally { await db.close(); }
});

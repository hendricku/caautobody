-- Apply ONLY after reviewing the Phase 02 migration. Additive; does not erase any CMS records.
create table if not exists public.cms_admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor','publisher')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.cms_admin_members enable row level security;
revoke all on public.cms_admin_members from anon, authenticated;
grant select on public.cms_admin_members to authenticated;
drop policy if exists "staff see own active membership" on public.cms_admin_members;
create policy "staff see own active membership" on public.cms_admin_members
for select to authenticated using (user_id = (select auth.uid()) and active);

create or replace function public.cms_staff_role()
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.cms_admin_members m
  where m.user_id = (select auth.uid()) and m.active limit 1;
$$;
revoke all on function public.cms_staff_role() from public, anon;
grant execute on function public.cms_staff_role() to authenticated;

-- Never use a public/anonymous write policy. RLS checks each user and old/new status.
do $$
declare t text;
begin
  foreach t in array array['cms_services','cms_locations','cms_offers','cms_blog_posts','cms_faqs','cms_gallery_items','cms_page_sections']
  loop
    execute format('grant insert, update on public.%I to authenticated', t);
    execute format('drop policy if exists "cms staff see drafts" on public.%I', t);
    execute format('create policy "cms staff see drafts" on public.%I for select to authenticated using (public.cms_staff_role() is not null)', t);
    execute format('drop policy if exists "cms staff insert" on public.%I', t);
    execute format('create policy "cms staff insert" on public.%I for insert to authenticated with check (public.cms_staff_role() in (''admin'', ''publisher'') or (public.cms_staff_role() = ''editor'' and status = ''draft''))', t);
    execute format('drop policy if exists "cms staff update" on public.%I', t);
    execute format('create policy "cms staff update" on public.%I for update to authenticated using (public.cms_staff_role() in (''admin'', ''publisher'') or (public.cms_staff_role() = ''editor'' and status = ''draft'')) with check (public.cms_staff_role() in (''admin'', ''publisher'') or (public.cms_staff_role() = ''editor'' and status = ''draft''))', t);
  end loop;
end $$;
-- CMS media metadata is managed only by publishers; browser Storage upload is handled separately.
grant insert, update, select on public.cms_media_assets to authenticated;
drop policy if exists "cms staff inspect media" on public.cms_media_assets;
create policy "cms staff inspect media" on public.cms_media_assets for select to authenticated using (public.cms_staff_role() is not null);
drop policy if exists "cms publishers insert media" on public.cms_media_assets;
create policy "cms publishers insert media" on public.cms_media_assets for insert to authenticated with check (public.cms_staff_role() in ('admin','publisher'));
drop policy if exists "cms publishers update media" on public.cms_media_assets;
create policy "cms publishers update media" on public.cms_media_assets for update to authenticated using (public.cms_staff_role() in ('admin','publisher')) with check (public.cms_staff_role() in ('admin','publisher'));

-- Site settings: only Admin/Publisher can change public configuration.
grant insert, update on public.cms_site_settings to authenticated;
drop policy if exists "cms staff inspect settings" on public.cms_site_settings;
create policy "cms staff inspect settings" on public.cms_site_settings for select to authenticated using (public.cms_staff_role() is not null);
drop policy if exists "cms publishers insert settings" on public.cms_site_settings;
create policy "cms publishers insert settings" on public.cms_site_settings for insert to authenticated with check (public.cms_staff_role() in ('admin','publisher'));
drop policy if exists "cms publishers update settings" on public.cms_site_settings;
create policy "cms publishers update settings" on public.cms_site_settings for update to authenticated using (public.cms_staff_role() in ('admin','publisher')) with check (public.cms_staff_role() in ('admin','publisher'));

create table if not exists public.cms_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  record_id uuid,
  operation text not null,
  old_status text,
  new_status text,
  created_at timestamptz not null default now()
);
alter table public.cms_audit_log enable row level security;
revoke all on public.cms_audit_log from anon, authenticated;
grant select on public.cms_audit_log to authenticated;
drop policy if exists "admin audit read" on public.cms_audit_log;
create policy "admin audit read" on public.cms_audit_log for select to authenticated using (public.cms_staff_role() = 'admin');
create or replace function public.cms_audit_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null then
    insert into public.cms_audit_log(actor_id, table_name, record_id, operation, old_status, new_status)
    values ((select auth.uid()), TG_TABLE_NAME, new.id, TG_OP,
      case when TG_OP = 'UPDATE' then old.status::text else null end, new.status::text);
  end if;
  return new;
end; $$;
revoke all on function public.cms_audit_mutation() from public;
do $$ declare t text; begin
  foreach t in array array['cms_services','cms_locations','cms_offers','cms_blog_posts','cms_faqs','cms_gallery_items','cms_page_sections'] loop
    execute format('drop trigger if exists cms_audit_insert_update on public.%I', t);
    execute format('create trigger cms_audit_insert_update after insert or update on public.%I for each row execute function public.cms_audit_mutation()', t);
  end loop;
end $$;

-- Retain original media during editing. Only publication moves reviewed images to cms-public.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('cms-staging','cms-staging',false,5242880,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/webp'];
drop policy if exists "cms staff upload draft media" on storage.objects;
create policy "cms staff upload draft media" on storage.objects for insert to authenticated
with check (bucket_id = 'cms-staging' and public.cms_staff_role() in ('admin','editor','publisher'));
drop policy if exists "cms staff view draft media" on storage.objects;
create policy "cms staff view draft media" on storage.objects for select to authenticated
using (bucket_id = 'cms-staging' and public.cms_staff_role() is not null);
-- Publication promotion is controlled by a publisher, not anonymous uploads.
drop policy if exists "cms publishers upload published media" on storage.objects;
create policy "cms publishers upload published media" on storage.objects for insert to authenticated
with check (bucket_id = 'cms-public' and public.cms_staff_role() in ('admin','publisher'));

-- Do not automatically grant admin status by email alone.
-- First create/invite the email identity in Supabase Auth. Then bootstrap explicitly:
-- insert into public.cms_admin_members(user_id,role)
-- select id,'admin' from auth.users where email = 'REPLACE_WITH_APPROVED_ADMIN_EMAIL'
-- on conflict (user_id) do update set role='admin',active=true;

drop policy if exists "admins see memberships" on public.cms_admin_members;
create policy "admins see memberships" on public.cms_admin_members
for select to authenticated using (public.cms_staff_role() = 'admin');

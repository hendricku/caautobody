-- Additive module permissions. Existing staff keep their existing access.
begin;
alter table public.cms_admin_members add column if not exists modules text[];

create or replace function public.cms_can_access(p_module text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select m.role = 'admin' or m.modules is null or p_module = any(m.modules)
    from public.cms_admin_members m
    where m.user_id = (select auth.uid()) and m.active and public.cms_staff_role() is not null), false)
$$;
revoke all on function public.cms_can_access(text) from public, anon;
grant execute on function public.cms_can_access(text) to authenticated;

create or replace function public.cms_unrestricted_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select (m.role = 'admin' or m.modules is null) and public.cms_staff_role() is not null
    from public.cms_admin_members m where m.user_id = (select auth.uid()) and m.active), false)
$$;
revoke all on function public.cms_unrestricted_staff() from public, anon;
grant execute on function public.cms_unrestricted_staff() to authenticated;
drop policy if exists "cms restricted staging access" on storage.objects;
create policy "cms restricted staging access" on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'cms-staging' or public.cms_unrestricted_staff() or split_part(name, '/', 1) = (select auth.uid())::text);
drop policy if exists "cms restricted staging upload" on storage.objects;
create policy "cms restricted staging upload" on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'cms-staging' or public.cms_unrestricted_staff() or split_part(name, '/', 1) = (select auth.uid())::text);

create or replace function public.cms_service_module(p_slug text, p_content jsonb)
returns text language sql immutable set search_path = '' as $$
  select case when p_slug in ('tesla-approved-repair-centre','services-zeekr-approved-repairer-melbourne','byd-approved-repairer-melbourne','lexus-approved-body-shop-melbourne')
    or p_content->>'variant' = 'brand' then 'brands' else 'services' end
$$;

do $$
declare pair text[]; table_name text; module_name text;
begin
  foreach pair slice 1 in array array[
    array['cms_blog_posts','blogs'], array['cms_locations','areas'],
    array['cms_offers','offers'], array['cms_faqs','faq'],
    array['cms_gallery_items','gallery'], array['cms_page_sections','settings'],
    array['cms_site_settings','settings'], array['cms_enquiries','contacts']
  ] loop
    table_name := pair[1]; module_name := pair[2];
    execute format('drop policy if exists "cms module restriction" on public.%I', table_name);
    execute format('create policy "cms module restriction" on public.%I as restrictive for all to authenticated using (public.cms_can_access(%L)) with check (public.cms_can_access(%L))', table_name, module_name, module_name);
  end loop;
end $$;
drop policy if exists "cms module restriction" on public.cms_services;
drop policy if exists "cms module service select" on public.cms_services;
drop policy if exists "cms module service insert" on public.cms_services;
drop policy if exists "cms module service update" on public.cms_services;
drop policy if exists "cms module service delete" on public.cms_services;
create policy "cms module service select" on public.cms_services as restrictive for select to authenticated
using (public.cms_can_access(public.cms_service_module(slug, content_json))
  or (status = 'published' and public.cms_can_access('settings')));
create policy "cms module service insert" on public.cms_services as restrictive for insert to authenticated
with check (public.cms_can_access(public.cms_service_module(slug, content_json)));
create policy "cms module service update" on public.cms_services as restrictive for update to authenticated
using (public.cms_can_access(public.cms_service_module(slug, content_json)))
with check (public.cms_can_access(public.cms_service_module(slug, content_json)));
create policy "cms module service delete" on public.cms_services as restrictive for delete to authenticated
using (public.cms_can_access(public.cms_service_module(slug, content_json)));

-- The previous function used definer privileges and bypassed gallery RLS.
do $$ begin
  if to_regprocedure('public.cms_reorder_gallery(text[])') is not null then
    alter function public.cms_reorder_gallery(text[]) security invoker;
  end if;
end $$;

create or replace function public.cms_list_team_members()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or public.cms_staff_role() is distinct from 'admin' then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc, t.user_id) from (
    select m.user_id, u.email, m.role, m.active, m.created_at, u.last_sign_in_at, m.modules
    from public.cms_admin_members m join auth.users u on u.id = m.user_id
    order by m.created_at desc, m.user_id limit 200
  ) t), '[]'::jsonb);
end $$;

create or replace function public.cms_set_member_modules(p_user_id uuid, p_modules text[])
returns void language plpgsql security definer set search_path = '' as $$
declare old_modules text[]; actor uuid := (select auth.uid());
begin
  if actor is null or public.cms_staff_role() is distinct from 'admin' then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  if p_user_id = actor then raise exception 'Cannot change own access' using errcode = '23514'; end if;
  if p_modules is not null and (cardinality(p_modules) < 1 or cardinality(p_modules) > 9
     or exists (select 1 from unnest(p_modules) x where x not in ('blogs','services','brands','offers','areas','gallery','faq','contacts','settings'))
     or (select count(distinct x) from unnest(p_modules) x) <> cardinality(p_modules)) then
    raise exception 'Invalid modules' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(724019, 1);
  if public.cms_staff_role() is distinct from 'admin' then raise exception 'Administrator required' using errcode = '42501'; end if;
  select modules into old_modules from public.cms_admin_members where user_id = p_user_id for update;
  if not found then raise exception 'Limited member not found' using errcode = 'P0002'; end if;
  update public.cms_admin_members set modules = p_modules, role = case when p_modules is null then 'admin' else 'publisher' end where user_id = p_user_id;
  insert into public.cms_audit_log(actor_id, table_name, record_id, operation, old_status, new_status)
    values (actor, 'cms_admin_members', p_user_id::text, 'permissions', array_to_string(old_modules, ','), array_to_string(p_modules, ','));
end $$;
revoke all on function public.cms_set_member_modules(uuid,text[]) from public, anon;
grant execute on function public.cms_set_member_modules(uuid,text[]) to authenticated;

create or replace function public.cms_add_limited_member(p_email text, p_modules text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare target uuid; actor uuid := (select auth.uid());
begin
  if actor is null or public.cms_staff_role() is distinct from 'admin' then raise exception 'Administrator required' using errcode = '42501'; end if;
  if p_email is null or length(p_email) > 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or p_modules is null or cardinality(p_modules) < 1 or cardinality(p_modules) > 9
     or exists (select 1 from unnest(p_modules) x where x not in ('blogs','services','brands','offers','areas','gallery','faq','contacts','settings'))
     or (select count(distinct x) from unnest(p_modules) x) <> cardinality(p_modules) then
    raise exception 'Invalid member' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(724019, 1);
  if public.cms_staff_role() is distinct from 'admin' then raise exception 'Administrator required' using errcode = '42501'; end if;
  select id into target from auth.users where lower(email) = lower(trim(p_email)) and deleted_at is null limit 1;
  if target is null then return jsonb_build_object('identity_required', true); end if;
  if (select count(*) from public.cms_admin_members) >= 200 then raise exception 'Team capacity reached' using errcode = '54000'; end if;
  insert into public.cms_admin_members(user_id, role, active, access_after, modules)
    values (target, 'publisher', true, clock_timestamp(), p_modules);
  insert into public.cms_audit_log(actor_id, table_name, record_id, operation, new_status)
    values (actor, 'cms_admin_members', target::text, 'add', array_to_string(p_modules, ','));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.cms_add_limited_member(text,text[]) from public, anon;
grant execute on function public.cms_add_limited_member(text,text[]) to authenticated;
commit;

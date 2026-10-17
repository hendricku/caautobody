-- Team management uses the administrator's verified session, never a browser-supplied role.
-- Existing accounts keep their current sessions until an explicit access change.
begin;

alter table public.cms_admin_members
  add column if not exists access_after timestamptz not null default '-infinity'::timestamptz;

create or replace function public.cms_staff_role()
returns text language sql stable security definer set search_path = '' as $$
  select m.role
  from public.cms_admin_members m
  join auth.sessions s on s.user_id = m.user_id
  where m.user_id = (select auth.uid()) and m.active
    and s.id::text = ((select auth.jwt()) ->> 'session_id')
    and s.created_at >= m.access_after
  limit 1;
$$;
revoke all on function public.cms_staff_role() from public, anon;
grant execute on function public.cms_staff_role() to authenticated;

drop policy if exists "staff see own active membership" on public.cms_admin_members;
create policy "staff see own active membership" on public.cms_admin_members
  for select to authenticated using (
    user_id = (select auth.uid()) and active and (select public.cms_staff_role()) is not null
  );
-- Browsers cannot bypass the transactional operations below.
revoke insert, update, delete on public.cms_admin_members from anon, authenticated;

create or replace function public.cms_list_team_members()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or public.cms_staff_role() is distinct from 'admin' then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(t) order by t.created_at desc, t.user_id) from (
      select m.user_id, u.email, m.role, m.active, m.created_at, u.last_sign_in_at
      from public.cms_admin_members m join auth.users u on u.id = m.user_id
      order by m.created_at desc, m.user_id limit 200
    ) t
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.cms_list_team_members() from public, anon;
grant execute on function public.cms_list_team_members() to authenticated;

create or replace function public.cms_manage_team_member(p_action text, p_email text default null, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  target uuid;
  target_email text;
  previous public.cms_admin_members%rowtype;
  old_value text;
  new_value text;
begin
  if actor is null or public.cms_staff_role() is distinct from 'admin' then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('add', 'deactivate', 'reactivate', 'delete') then
    raise exception 'Invalid action' using errcode = '22023';
  end if;
  -- Serialize all team changes, including concurrent administrators targeting each other.
  perform pg_catalog.pg_advisory_xact_lock(724019, 1);
  if public.cms_staff_role() is distinct from 'admin' then
    raise exception 'Administrator required' using errcode = '42501';
  end if;

  if p_action = 'add' then
    if p_user_id is not null or p_email is null or length(p_email) > 254
      or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'Invalid email' using errcode = '22023';
    end if;
    select u.id, u.email into target, target_email from auth.users u
      where lower(u.email) = lower(trim(p_email)) and u.deleted_at is null limit 1;
    if target is null then return jsonb_build_object('identity_required', true); end if;
    if exists (select 1 from public.cms_admin_members where user_id = target) then
      raise exception 'Member already exists' using errcode = '23505';
    end if;
    if (select count(*) from public.cms_admin_members) >= 200 then
      raise exception 'Team capacity reached' using errcode = '54000';
    end if;
    insert into public.cms_admin_members(user_id, role, active, access_after)
      values (target, 'admin', true, clock_timestamp());
    new_value := target_email || ' | admin | active';
  else
    if p_user_id is null or p_email is not null then
      raise exception 'Invalid member' using errcode = '22023';
    end if;
    if p_user_id = actor then raise exception 'Cannot change own access' using errcode = '23514'; end if;
    select * into previous from public.cms_admin_members where user_id = p_user_id for update;
    if not found then raise exception 'Member not found' using errcode = 'P0002'; end if;
    target := p_user_id;
    select u.email into target_email from auth.users u where u.id = target;
    old_value := target_email || ' | ' || previous.role || ' | ' || case when previous.active then 'active' else 'inactive' end;
    if p_action in ('deactivate', 'delete') and previous.active and previous.role = 'admin'
      and (select count(*) from public.cms_admin_members where active and role = 'admin') <= 1 then
      raise exception 'Last administrator required' using errcode = '23514';
    end if;
    if p_action = 'delete' then
      -- Remove CMS access, retaining Auth identity and authored content/audit history.
      delete from public.cms_admin_members where user_id = target;
      new_value := target_email || ' | removed';
    else
      if previous.active = (p_action = 'reactivate') then return jsonb_build_object('ok', true); end if;
      update public.cms_admin_members set active = (p_action = 'reactivate'), access_after = clock_timestamp()
        where user_id = target;
      new_value := target_email || ' | ' || previous.role || ' | ' || case when p_action = 'reactivate' then 'active' else 'inactive' end;
    end if;
  end if;
  -- If auditing fails the membership change also rolls back.
  insert into public.cms_audit_log(actor_id, actor_email, table_name, record_id, operation, old_status, new_status)
    values (actor, (select auth.jwt()) ->> 'email', 'cms_admin_members', target::text,
      case p_action when 'add' then 'INSERT' when 'delete' then 'DELETE' when 'deactivate' then 'DEACTIVATE' else 'REACTIVATE' end,
      old_value, new_value);
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.cms_manage_team_member(text, text, uuid) from public, anon;
grant execute on function public.cms_manage_team_member(text, text, uuid) to authenticated;

-- Only the server can check an email before sending an OTP. No public directory lookup.
create or replace function public.cms_can_request_admin_otp(p_email text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cms_admin_members m join auth.users u on u.id = m.user_id
    where m.active and lower(u.email) = lower(trim(p_email)) and u.deleted_at is null
  );
$$;
revoke all on function public.cms_can_request_admin_otp(text) from public, anon, authenticated;
grant execute on function public.cms_can_request_admin_otp(text) to service_role;

notify pgrst, 'reload schema';
commit;

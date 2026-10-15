-- Repair the inherited audit table without deleting historical entries.
-- This migration is intentionally additive and supports both the legacy
-- action/happened_at layout and the current operation/created_at layout.

begin;

alter table public.cms_audit_log
  add column if not exists actor_email text,
  add column if not exists record_id text,
  add column if not exists operation text,
  add column if not exists old_status text,
  add column if not exists new_status text,
  add column if not exists created_at timestamptz;

-- Legacy installations can retain required action/happened_at fields after
-- create table if not exists skipped the current table definition. They are
-- retained for history but must not block current trigger writes.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_audit_log' and column_name = 'action'
  ) then
    alter table public.cms_audit_log alter column action drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_audit_log' and column_name = 'happened_at'
  ) then
    alter table public.cms_audit_log alter column happened_at drop not null;
  end if;
end $$;

update public.cms_audit_log as audit
set
  operation = coalesce(audit.operation, to_jsonb(audit) ->> 'action', 'LEGACY'),
  created_at = coalesce(
    audit.created_at,
    nullif(to_jsonb(audit) ->> 'happened_at', '')::timestamptz,
    now()
  )
where audit.operation is null or audit.created_at is null;

alter table public.cms_audit_log
  alter column operation set not null,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column record_id type text using record_id::text;

create index if not exists cms_audit_log_created_at_idx
  on public.cms_audit_log (created_at desc);
create index if not exists cms_audit_log_table_created_idx
  on public.cms_audit_log (table_name, created_at desc);

create or replace function public.cms_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  record_key text;
  status_before text;
  status_after text;
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  record_key := coalesce(
    to_jsonb(new) ->> 'id',
    to_jsonb(new) ->> 'key',
    to_jsonb(new) ->> 'legacy_key'
  );
  status_after := to_jsonb(new) ->> 'status';
  if tg_op = 'UPDATE' then
    status_before := to_jsonb(old) ->> 'status';
  end if;

  insert into public.cms_audit_log(
    actor_id,
    actor_email,
    table_name,
    record_id,
    operation,
    old_status,
    new_status
  ) values (
    (select auth.uid()),
    nullif((select auth.jwt() ->> 'email'), ''),
    tg_table_name,
    record_key,
    tg_op,
    status_before,
    status_after
  );

  return new;
exception when others then
  -- A damaged legacy audit record must not prevent an authorized CMS save.
  -- The database warning remains available to administrators for follow-up.
  raise warning 'CMS audit event could not be recorded for %: %', tg_table_name, sqlerrm;
  return new;
end;
$$;

revoke all on function public.cms_audit_mutation() from public, anon, authenticated;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'cms_services',
    'cms_locations',
    'cms_offers',
    'cms_blog_posts',
    'cms_faqs',
    'cms_gallery_items',
    'cms_page_sections',
    'cms_site_settings',
    'cms_enquiries'
  ]
  loop
    if to_regclass(format('public.%I', target_table)) is not null then
      execute format('drop trigger if exists cms_audit_insert_update on public.%I', target_table);
      execute format(
        'create trigger cms_audit_insert_update after insert or update on public.%I for each row execute function public.cms_audit_mutation()',
        target_table
      );
    end if;
  end loop;
end $$;

alter table public.cms_audit_log enable row level security;
revoke all on public.cms_audit_log from anon, authenticated;
grant select on public.cms_audit_log to authenticated;
drop policy if exists "admin audit read" on public.cms_audit_log;
create policy "admin audit read" on public.cms_audit_log
for select to authenticated
using (public.cms_staff_role() = 'admin');

commit;

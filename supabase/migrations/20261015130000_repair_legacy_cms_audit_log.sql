-- Repair the legacy audit table without removing existing audit history.
-- Older installations used action/happened_at; the current CMS trigger uses
-- operation/old_status/new_status/created_at.

begin;

alter table if exists public.cms_audit_log
  add column if not exists operation text,
  add column if not exists old_status text,
  add column if not exists new_status text,
  add column if not exists created_at timestamptz;

-- to_jsonb keeps this safe for both legacy and fresh installations: absent
-- legacy columns resolve to null rather than making the migration fail.
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
  alter column created_at set default now();

create index if not exists cms_audit_log_created_at_idx
  on public.cms_audit_log (created_at desc);

commit;

-- Public website enquiries are inserted only by the trusted Next.js server.
-- They are never readable or writable with an anonymous browser key.
create table if not exists public.cms_enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_type text not null check (enquiry_type in ('contact', 'brand-assessment')),
  brand text check (brand in ('BYD', 'Lexus')),
  full_name text not null check (char_length(full_name) between 1 and 160),
  phone text not null check (char_length(phone) between 1 and 80),
  email text not null default '' check (char_length(email) <= 254),
  suburb text not null default '' check (char_length(suburb) <= 160),
  service text not null check (char_length(service) between 1 and 160),
  vehicle text not null default '' check (char_length(vehicle) <= 160),
  claim_status text not null default '' check (char_length(claim_status) <= 80),
  message text not null default '' check (char_length(message) <= 10000),
  attachment_names jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new', 'in-progress', 'resolved', 'archived')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_enquiries_active_created_at_idx
  on public.cms_enquiries (status, created_at desc);

alter table public.cms_enquiries enable row level security;
revoke all on public.cms_enquiries from anon, authenticated;
grant select, update on public.cms_enquiries to authenticated;

drop policy if exists "cms staff read enquiries" on public.cms_enquiries;
create policy "cms staff read enquiries" on public.cms_enquiries
for select to authenticated
using (public.cms_staff_role() is not null);

drop policy if exists "cms staff update enquiries" on public.cms_enquiries;
create policy "cms staff update enquiries" on public.cms_enquiries
for update to authenticated
using (public.cms_staff_role() in ('admin', 'editor', 'publisher'))
with check (public.cms_staff_role() in ('admin', 'editor', 'publisher'));

-- Shared, database-backed request limiting works across Vercel instances.
create table if not exists public.cms_public_rate_limits (
  scope text not null,
  request_key text not null,
  window_started_at timestamptz not null default now(),
  hits integer not null default 0 check (hits >= 0),
  primary key (scope, request_key)
);
alter table public.cms_public_rate_limits enable row level security;
revoke all on public.cms_public_rate_limits from anon, authenticated;

create or replace function public.cms_consume_public_rate_limit(
  p_scope text,
  p_request_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  allowed boolean;
begin
  if p_scope !~ '^[a-z0-9_-]{1,80}$'
    or p_request_key !~ '^[a-f0-9]{64}$'
    or p_limit < 1 or p_limit > 100
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public.cms_public_rate_limits as limits (scope, request_key, window_started_at, hits)
  values (p_scope, p_request_key, now(), 1)
  on conflict (scope, request_key) do update
  set window_started_at = case
        when limits.window_started_at + make_interval(secs => p_window_seconds) <= now() then now()
        else limits.window_started_at
      end,
      hits = case
        when limits.window_started_at + make_interval(secs => p_window_seconds) <= now() then 1
        else limits.hits + 1
      end
  returning hits <= p_limit into allowed;

  return coalesce(allowed, false);
end;
$$;
revoke all on function public.cms_consume_public_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.cms_consume_public_rate_limit(text, text, integer, integer) to service_role;

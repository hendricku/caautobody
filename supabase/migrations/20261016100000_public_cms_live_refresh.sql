-- A single public version marker lets open public pages refresh after a
-- published CMS change without subscribing to content rows or draft data.
begin;

create table if not exists public.cms_publication_state (
  id boolean primary key default true check (id),
  updated_at timestamptz not null default clock_timestamp()
);

insert into public.cms_publication_state (id, updated_at)
values (true, clock_timestamp())
on conflict (id) do nothing;

alter table public.cms_publication_state enable row level security;
revoke all on public.cms_publication_state from public;
grant select on public.cms_publication_state to anon, authenticated;
drop policy if exists "public may read cms publication version" on public.cms_publication_state;
create policy "public may read cms publication version"
on public.cms_publication_state for select to anon, authenticated using (id = true);

create or replace function public.cms_mark_publication_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  was_public boolean := false;
  is_public boolean := false;
begin
  if tg_table_name = 'cms_site_settings' then
    was_public := coalesce((to_jsonb(old) ->> 'is_public')::boolean, false);
    is_public := coalesce((to_jsonb(new) ->> 'is_public')::boolean, false);
  else
    was_public := coalesce(to_jsonb(old) ->> 'status', '') = 'published';
    is_public := coalesce(to_jsonb(new) ->> 'status', '') = 'published';
  end if;

  if was_public or is_public then
    update public.cms_publication_state set updated_at = clock_timestamp() where id = true;
    -- Public Broadcast carries no row data. It is only a prompt to read the
    -- RLS-protected timestamp above, and the browser debounces validation.
    begin
      if to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null then
        perform realtime.send('{}'::jsonb, 'content-published', 'cms-publication', false);
      end if;
    exception when others then
      raise warning 'CMS publication broadcast could not be sent: %', sqlerrm;
    end;
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.cms_mark_publication_change() from public, anon, authenticated;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'cms_services', 'cms_locations', 'cms_offers', 'cms_blog_posts',
    'cms_faqs', 'cms_gallery_items', 'cms_page_sections', 'cms_site_settings'
  ] loop
    if to_regclass(format('public.%I', target_table)) is not null then
      execute format('drop trigger if exists cms_publication_version_change on public.%I', target_table);
      execute format('create trigger cms_publication_version_change after insert or update or delete on public.%I for each row execute function public.cms_mark_publication_change()', target_table);
    end if;
  end loop;
end;
$$;

commit;

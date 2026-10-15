-- Phase 02: public, read-only CMS foundation.
-- This migration intentionally creates no client write policies. Dashboard writes
-- remain disabled until the separate Supabase Auth and authorization phase.

create extension if not exists pgcrypto;

do $$ begin
  create type public.cms_publication_status as enum ('draft', 'published', 'retired');
exception when duplicate_object then null;
end $$;

create table if not exists public.cms_migration_batches (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  source_checksum text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_services (
  id uuid primary key default gen_random_uuid(),
  legacy_key text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  seo_title text not null,
  eyebrow text not null,
  intro text not null,
  body jsonb not null default '[]'::jsonb,
  image_path text not null,
  highlights jsonb not null default '[]'::jsonb,
  content_pending boolean not null default false,
  content_json jsonb not null default '{}'::jsonb,
  status public.cms_publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_locations (
  id uuid primary key default gen_random_uuid(),
  legacy_key text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  seo_title text not null,
  intro text not null,
  body jsonb not null default '[]'::jsonb,
  image_path text not null,
  coordinates jsonb not null default '[]'::jsonb,
  map_description text not null,
  status public.cms_publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_offers (
  id uuid primary key default gen_random_uuid(),
  legacy_key text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  seo_title text not null,
  eyebrow text not null,
  intro text not null,
  body jsonb not null default '[]'::jsonb,
  image_path text not null,
  bullets jsonb not null default '[]'::jsonb,
  status public.cms_publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_blog_posts (
  id uuid primary key default gen_random_uuid(),
  legacy_key text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  category text not null check (category in ('CA Knows', 'Client Stories')),
  display_date text not null,
  excerpt text not null,
  image_path text not null,
  blocks jsonb not null default '[]'::jsonb,
  status public.cms_publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_faqs (
  id uuid primary key default gen_random_uuid(),
  legacy_key text not null unique,
  category text not null,
  question text not null,
  answer text not null,
  is_visible boolean not null default true,
  status public.cms_publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_gallery_items (
  id uuid primary key default gen_random_uuid(),
  legacy_key text not null unique,
  image_path text not null,
  caption text not null,
  category text not null,
  status public.cms_publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_media_assets (
  id uuid primary key default gen_random_uuid(),
  legacy_path text not null unique,
  storage_path text not null unique,
  fallback_path text not null,
  mime_type text not null check (mime_type in ('image/webp', 'image/jpeg', 'image/png')),
  checksum_sha256 text not null,
  storage_ready boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  status public.cms_publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_key, section_key)
);

create or replace function public.cms_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.cms_set_updated_at() from public;

drop trigger if exists cms_services_updated_at on public.cms_services;
create trigger cms_services_updated_at before update on public.cms_services for each row execute function public.cms_set_updated_at();
drop trigger if exists cms_locations_updated_at on public.cms_locations;
create trigger cms_locations_updated_at before update on public.cms_locations for each row execute function public.cms_set_updated_at();
drop trigger if exists cms_offers_updated_at on public.cms_offers;
create trigger cms_offers_updated_at before update on public.cms_offers for each row execute function public.cms_set_updated_at();
drop trigger if exists cms_blog_posts_updated_at on public.cms_blog_posts;
create trigger cms_blog_posts_updated_at before update on public.cms_blog_posts for each row execute function public.cms_set_updated_at();
drop trigger if exists cms_faqs_updated_at on public.cms_faqs;
create trigger cms_faqs_updated_at before update on public.cms_faqs for each row execute function public.cms_set_updated_at();
drop trigger if exists cms_gallery_items_updated_at on public.cms_gallery_items;
create trigger cms_gallery_items_updated_at before update on public.cms_gallery_items for each row execute function public.cms_set_updated_at();
drop trigger if exists cms_media_assets_updated_at on public.cms_media_assets;
create trigger cms_media_assets_updated_at before update on public.cms_media_assets for each row execute function public.cms_set_updated_at();
drop trigger if exists cms_page_sections_updated_at on public.cms_page_sections;
create trigger cms_page_sections_updated_at before update on public.cms_page_sections for each row execute function public.cms_set_updated_at();
drop trigger if exists cms_site_settings_updated_at on public.cms_site_settings;
create trigger cms_site_settings_updated_at before update on public.cms_site_settings for each row execute function public.cms_set_updated_at();

create index if not exists cms_services_published_sort_idx on public.cms_services (status, sort_order);
create index if not exists cms_locations_published_sort_idx on public.cms_locations (status, sort_order);
create index if not exists cms_offers_published_sort_idx on public.cms_offers (status, sort_order);
create index if not exists cms_blog_posts_published_sort_idx on public.cms_blog_posts (status, sort_order);
create index if not exists cms_faqs_published_sort_idx on public.cms_faqs (status, is_visible, sort_order);
create index if not exists cms_gallery_items_published_sort_idx on public.cms_gallery_items (status, sort_order);
create index if not exists cms_page_sections_published_sort_idx on public.cms_page_sections (page_key, status, sort_order);

alter table public.cms_site_settings enable row level security;
alter table public.cms_services enable row level security;
alter table public.cms_locations enable row level security;
alter table public.cms_offers enable row level security;
alter table public.cms_blog_posts enable row level security;
alter table public.cms_faqs enable row level security;
alter table public.cms_gallery_items enable row level security;
alter table public.cms_media_assets enable row level security;
alter table public.cms_page_sections enable row level security;
alter table public.cms_migration_batches enable row level security;

revoke all on table public.cms_site_settings, public.cms_services, public.cms_locations, public.cms_offers, public.cms_blog_posts, public.cms_faqs, public.cms_gallery_items, public.cms_media_assets, public.cms_page_sections, public.cms_migration_batches from anon, authenticated;
grant select on table public.cms_site_settings, public.cms_services, public.cms_locations, public.cms_offers, public.cms_blog_posts, public.cms_faqs, public.cms_gallery_items, public.cms_media_assets, public.cms_page_sections to anon, authenticated;

drop policy if exists "public reads public site settings" on public.cms_site_settings;
create policy "public reads public site settings" on public.cms_site_settings for select to anon, authenticated using (is_public);
drop policy if exists "public reads published services" on public.cms_services;
create policy "public reads published services" on public.cms_services for select to anon, authenticated using (status = 'published');
drop policy if exists "public reads published locations" on public.cms_locations;
create policy "public reads published locations" on public.cms_locations for select to anon, authenticated using (status = 'published');
drop policy if exists "public reads published offers" on public.cms_offers;
create policy "public reads published offers" on public.cms_offers for select to anon, authenticated using (status = 'published');
drop policy if exists "public reads published blogs" on public.cms_blog_posts;
create policy "public reads published blogs" on public.cms_blog_posts for select to anon, authenticated using (status = 'published');
drop policy if exists "public reads published visible faqs" on public.cms_faqs;
create policy "public reads published visible faqs" on public.cms_faqs for select to anon, authenticated using (status = 'published' and is_visible);
drop policy if exists "public reads published gallery items" on public.cms_gallery_items;
create policy "public reads published gallery items" on public.cms_gallery_items for select to anon, authenticated using (status = 'published');
drop policy if exists "public reads public media metadata" on public.cms_media_assets;
create policy "public reads public media metadata" on public.cms_media_assets for select to anon, authenticated using (is_public);
drop policy if exists "public reads published page sections" on public.cms_page_sections;
create policy "public reads published page sections" on public.cms_page_sections for select to anon, authenticated using (status = 'published');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-public', 'cms-public', true, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

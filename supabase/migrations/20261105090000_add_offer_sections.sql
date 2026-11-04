-- Additive JSON payload for the ordered Offer builder. Existing offer fields remain intact.
alter table public.cms_offers
  add column if not exists content_json jsonb not null default '{}'::jsonb;

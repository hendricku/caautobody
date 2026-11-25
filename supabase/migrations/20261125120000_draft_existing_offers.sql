-- Preserve existing offers and move them to draft. Built-in landing-page copy
-- remains in the application; these rows let staff control publication.
update public.cms_offers set status = 'draft' where status = 'published';

insert into public.cms_offers (legacy_key, slug, title, seo_title, eyebrow, intro, image_path, status)
select 'ads-landing-' || slug, slug, title, title, 'Repair assessment', 'Advertising landing page.', '', 'draft'
from (values
  ('lexus-approved-body-shop-melbourne', 'Lexus Approved Repairer Melbourne'),
  ('fleet-and-commercial-repairs', 'Fleet and Commercial Repairs'),
  ('byd-approved-repairer-melbourne', 'BYD Approved Repairer Melbourne'),
  ('not-at-fault-accident-repairs', 'Not At Fault Accident Repairs'),
  ('tesla-approved-body-shop-melbourne', 'Tesla Approved Body Shop Melbourne'),
  ('zeekr-authorised-repairer-melbourne', 'Zeekr Authorised Repairer Melbourne')
) as landing(slug, title)
on conflict do nothing;

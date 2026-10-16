-- Approved-brand pages now render from a single shared editorial source.
-- Remove only stale embedded page payloads that would override that source.
update public.cms_services
set
  title = 'BYD Approved Repairer Melbourne',
  seo_title = 'BYD Approved Repairer Melbourne | CA Autobody',
  intro = 'BYD vehicles combine high voltage battery systems, advanced driver assistance technology and model-specific body structures. CA Autobody delivers approved BYD repairs using genuine OEM BYD parts and manufacturer-approved procedures.',
  content_json = coalesce(content_json, '{}'::jsonb) - 'data',
  updated_at = now()
where slug = 'byd-approved-repairer-melbourne';

update public.cms_services
set
  title = 'Lexus Approved Body Shop Melbourne',
  seo_title = 'Lexus Approved Body Shop Melbourne | CA Autobody',
  intro = 'A Lexus repair must restore safety, body accuracy, finish quality and the quiet refinement expected from the vehicle. CA Autobody provides manufacturer-approved Lexus repairs using genuine OEM Lexus parts and approved repair procedures.',
  content_json = coalesce(content_json, '{}'::jsonb) - 'data',
  updated_at = now()
where slug = 'lexus-approved-body-shop-melbourne';

update public.cms_services
set
  title = 'Zeekr Approved Repairer Melbourne',
  seo_title = 'Zeekr Approved Repairer Melbourne | CA Autobody',
  intro = 'When your Zeekr is damaged in an accident, the right repairer matters. Modern electric vehicles have advanced materials, safety systems, sensors and cameras that need correct repair methods and careful workmanship.',
  content_json = coalesce(content_json, '{}'::jsonb) - 'data',
  updated_at = now()
where slug = 'services-zeekr-approved-repairer-melbourne';

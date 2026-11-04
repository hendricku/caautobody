-- Four specialist vehicle pages are public service records with the brand
-- presentation. The rich, source-controlled copy is resolved in
-- specialistBrandContent.ts until an administrator saves an independent CMS
-- version. This inserts only missing records and never overwrites dashboard
-- edits made after deployment.
insert into public.cms_services (
  legacy_key, slug, title, seo_title, eyebrow, intro, body, image_path,
  highlights, content_pending, content_json, status, sort_order
) values
  (
    'specialist-brand-prestige',
    'prestige-vehicle-repairs',
    'Prestige Vehicle Repairs',
    'Prestige Vehicle Repairs | CA Autobody Melbourne',
    'Prestige Vehicle Repairs',
    'Exceptional vehicles receive exceptional care from CA Autobody.',
    '[]'::jsonb,
    '/images/prestige.webp',
    '[]'::jsonb,
    false,
    '{"placement":{"navigation":false,"navigationLabel":"","navigationSummary":"","homeSlider":true,"sliderLabel":"Prestige Vehicles","sliderKicker":"Specialist Repairs","sliderCopy":"Exceptional vehicles receive exceptional care, quality workmanship and factory-aligned repair procedures.","sliderCta":"Explore Prestige Repairs"}}'::jsonb,
    'published',
    35
  ),
  (
    'specialist-brand-fleet',
    'fleet-vehicle-repairs',
    'Fleet Vehicle Repairs',
    'Fleet Vehicle Repairs | CA Autobody Melbourne',
    'Fleet Vehicle Repairs',
    'Fleet repair support focused on quality, communication and efficient turnaround.',
    '[]'::jsonb,
    '/images/fleet.webp',
    '[]'::jsonb,
    false,
    '{"placement":{"navigation":false,"navigationLabel":"","navigationSummary":"","homeSlider":true,"sliderLabel":"Fleet Vehicles","sliderKicker":"Business Repair Support","sliderCopy":"A streamlined repair process, clear communication and dedicated service to minimise downtime.","sliderCta":"Explore Fleet Repairs"}}'::jsonb,
    'published',
    36
  ),
  (
    'specialist-brand-commercial',
    'commercial-vehicle-repairs',
    'Commercial Vehicle Repairs',
    'Commercial Vehicle Repairs | CA Autobody Melbourne',
    'Commercial Vehicle Repairs',
    'Purpose-built facilities and specialist equipment for larger commercial vehicles.',
    '[]'::jsonb,
    '/images/Commercial.webp',
    '[]'::jsonb,
    false,
    '{"placement":{"navigation":false,"navigationLabel":"","navigationSummary":"","homeSlider":true,"sliderLabel":"Commercial Vehicles","sliderKicker":"Specialist Facilities","sliderCopy":"Purpose-built repair capability for larger commercial vehicles, high-roof vans and light commercial vehicles.","sliderCta":"Explore Commercial Repairs"}}'::jsonb,
    'published',
    37
  ),
  (
    'specialist-brand-electric-vehicles',
    'electric-vehicle-repairs',
    'Electric Vehicle Repairs',
    'Electric Vehicle Repairs | CA Autobody Melbourne',
    'Electric Vehicle Repairs',
    'Specialist knowledge, advanced technology and trusted expertise for modern EV repairs.',
    '[]'::jsonb,
    '/images/electric%20vehicles.webp',
    '[]'::jsonb,
    false,
    '{"placement":{"navigation":false,"navigationLabel":"","navigationSummary":"","homeSlider":true,"sliderLabel":"Electric Vehicles","sliderKicker":"EV Repair Expertise","sliderCopy":"Specialist EV knowledge and advanced technology for a wide range of makes and models.","sliderCta":"Explore EV Repairs"}}'::jsonb,
    'published',
    38
  )
on conflict (slug) do nothing;

-- Existing menu-arrangement settings are editorial choices, so preserve their
-- current order and only append the new specialist pages to the homepage
-- slider when they are not already present. This prevents a saved arrangement
-- from silently hiding the newly published Brand pages.
with specialist_slugs (slug, position) as (
  values
    ('prestige-vehicle-repairs', 1),
    ('fleet-vehicle-repairs', 2),
    ('commercial-vehicle-repairs', 3),
    ('electric-vehicle-repairs', 4)
), existing as (
  select case when jsonb_typeof(value -> 'slider') = 'array'
    then value -> 'slider' else '[]'::jsonb end as slider
  from public.cms_site_settings
  where key = 'service_arrangement'
), merged as (
  select jsonb_agg(item.slug order by item.position) as slider
  from existing,
  lateral (
    select stored_item.slug, stored_item.position
    from jsonb_array_elements_text(existing.slider) with ordinality as stored_item(slug, position)
    union all
    select specialist.slug, 1000 + specialist.position
    from specialist_slugs as specialist
    where not exists (
      select 1 from jsonb_array_elements_text(existing.slider) as stored_item(slug)
      where stored_item.slug = specialist.slug
    )
  ) as item
)
update public.cms_site_settings as settings
set value = jsonb_set(settings.value, '{slider}', coalesce((select slider from merged), '[]'::jsonb), true)
where settings.key = 'service_arrangement';

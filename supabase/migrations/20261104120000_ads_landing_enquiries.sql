-- Adds fields for the six paid-ad landing pages without changing or deleting
-- any existing enquiry. Public submission remains server-only.
alter table public.cms_enquiries
  add column if not exists landing_page text,
  add column if not exists company_name text,
  add column if not exists fleet_size text,
  add column if not exists accident_date date;

alter table public.cms_enquiries
  drop constraint if exists cms_enquiries_enquiry_type_check,
  add constraint cms_enquiries_enquiry_type_check check (enquiry_type in ('contact', 'brand-assessment', 'landing-assessment'));

alter table public.cms_enquiries
  drop constraint if exists cms_enquiries_brand_check,
  add constraint cms_enquiries_brand_check check (brand is null or brand in ('BYD', 'Lexus', 'Tesla', 'Zeekr'));

alter table public.cms_enquiries
  add constraint cms_enquiries_landing_page_length check (landing_page is null or char_length(landing_page) <= 160),
  add constraint cms_enquiries_company_name_length check (company_name is null or char_length(company_name) <= 160),
  add constraint cms_enquiries_fleet_size_length check (fleet_size is null or char_length(fleet_size) <= 80);

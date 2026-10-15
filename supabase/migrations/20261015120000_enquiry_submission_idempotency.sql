-- Allows the public form to retry one logical submission without creating a second enquiry.
-- Existing rows intentionally remain null and are unaffected.
alter table public.cms_enquiries
  add column if not exists client_submission_id uuid;

create unique index if not exists cms_enquiries_client_submission_id_unique
  on public.cms_enquiries (client_submission_id)
  where client_submission_id is not null;

-- The client has retired the two five-question advisory sets. Keep the rows
-- out of public reads and dashboard ordering without destructively deleting
-- historical CMS records.
update public.cms_faqs
set status = 'retired',
    is_visible = false,
    updated_at = now()
where legacy_key in (
  'byd-question-1', 'byd-question-2', 'byd-question-3', 'byd-question-4', 'byd-question-5',
  'lexus-question-1', 'lexus-question-2', 'lexus-question-3', 'lexus-question-4', 'lexus-question-5'
)
and (status <> 'retired' or is_visible <> false);

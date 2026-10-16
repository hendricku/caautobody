-- Keep direct Supabase access aligned with the admin API: Editors cannot view
-- or change customer enquiries. Public submissions still use the server-only
-- service role and are unaffected.

drop policy if exists "cms staff read enquiries" on public.cms_enquiries;
create policy "cms publishers read enquiries" on public.cms_enquiries
for select to authenticated
using (public.cms_staff_role() in ('admin', 'publisher'));

drop policy if exists "cms staff update enquiries" on public.cms_enquiries;
create policy "cms publishers update enquiries" on public.cms_enquiries
for update to authenticated
using (public.cms_staff_role() in ('admin', 'publisher'))
with check (public.cms_staff_role() in ('admin', 'publisher'));

-- Record exports from a verified admin session without granting clients direct write access to audit history.
begin;
create or replace function public.cms_record_analytics_export(p_start date, p_end date)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if auth.uid() is null or public.cms_staff_role() <> 'admin' then raise exception 'Admin role required' using errcode = '42501'; end if;
  if p_start is null or p_end is null or p_start > p_end then raise exception 'Invalid analytics export range' using errcode = '22007'; end if;
  insert into public.cms_audit_log(actor_id, actor_email, table_name, record_id, operation, old_status, new_status)
  values (auth.uid(), nullif(auth.jwt() ->> 'email', ''), 'analytics_exports', p_start::text || ':' || p_end::text, 'EXPORT', null, p_start::text || ' to ' || p_end::text);
end;
$$;
revoke all on function public.cms_record_analytics_export(date, date) from public, anon;
grant execute on function public.cms_record_analytics_export(date, date) to authenticated;
commit;

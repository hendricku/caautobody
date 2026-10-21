-- OPTIONAL STAGING-FIRST MIGRATION. Do not deploy to production without approval.
-- All updates to a gallery arrangement become one PostgreSQL statement/transaction.
BEGIN;
CREATE OR REPLACE FUNCTION public.cms_reorder_gallery(p_ordered_ids text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  total integer;
  changed integer;
BEGIN
  IF auth.uid() IS NULL OR public.cms_staff_role() NOT IN ('publisher', 'admin') THEN
    RAISE EXCEPTION 'Publisher or Admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_ordered_ids IS NULL OR cardinality(p_ordered_ids) < 1 OR cardinality(p_ordered_ids) > 500
    OR EXISTS (SELECT 1 FROM unnest(p_ordered_ids) AS u(value) WHERE value IS NULL OR length(value) > 140 OR length(value) = 0)
    OR (SELECT count(DISTINCT value) FROM unnest(p_ordered_ids) AS u(value)) <> cardinality(p_ordered_ids) THEN
    RAISE EXCEPTION 'Invalid gallery order' USING ERRCODE = '22023';
  END IF;
  -- Serialize concurrent reorders for consistent snapshot/order counts.
  PERFORM 1 FROM public.cms_gallery_items WHERE status <> 'retired' ORDER BY id FOR UPDATE;
  SELECT count(*) INTO total FROM public.cms_gallery_items WHERE status <> 'retired';
  IF total <> cardinality(p_ordered_ids)
     OR EXISTS (SELECT 1 FROM unnest(p_ordered_ids) AS u(value) WHERE NOT EXISTS (
       SELECT 1 FROM public.cms_gallery_items WHERE legacy_key = value AND status <> 'retired')) THEN
    RAISE EXCEPTION 'Gallery changed. Reload before saving.' USING ERRCODE = '40001';
  END IF;
  WITH ordered AS (
    SELECT id, position * 10 AS next_order
    FROM unnest(p_ordered_ids) WITH ORDINALITY AS t(id, position)
  ), updated AS (
    UPDATE public.cms_gallery_items AS gallery
    SET sort_order = ordered.next_order
    FROM ordered
    WHERE gallery.legacy_key = ordered.id AND gallery.sort_order IS DISTINCT FROM ordered.next_order
    RETURNING gallery.id
  ) SELECT count(*) INTO changed FROM updated;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.cms_reorder_gallery(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cms_reorder_gallery(text[]) TO authenticated;
COMMIT;

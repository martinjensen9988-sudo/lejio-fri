-- Broaden vehicle image management to allow admins/support as well as vehicle owner
CREATE OR REPLACE FUNCTION public.can_manage_vehicle_image(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    -- Admin roles can manage any vehicle images
    WHEN public.has_any_admin_role(auth.uid()) THEN true
    WHEN object_name IS NULL OR object_name = '' THEN false
    WHEN storage.foldername(object_name) IS NULL THEN false
    WHEN (storage.foldername(object_name))[1] IS NULL THEN false
    WHEN (storage.foldername(object_name))[1] !~ '^[0-9a-fA-F-]{36}$' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.vehicles v
      WHERE v.id = ((storage.foldername(object_name))[1])::uuid
        AND v.owner_id = auth.uid()
    )
  END;
$$;
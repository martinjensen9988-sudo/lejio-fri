-- Robust helper: check vehicle ownership via SECURITY DEFINER SQL function
CREATE OR REPLACE FUNCTION public.is_vehicle_owner(_vehicle_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vehicles v
    WHERE v.id = _vehicle_id
      AND v.owner_id = _user_id
  );
$$;

-- Replace function used by storage policy to call the helper
CREATE OR REPLACE FUNCTION public.can_manage_vehicle_image_path(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      public.has_any_admin_role(auth.uid())
      OR (
        split_part(object_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND public.is_vehicle_owner(split_part(object_name, '/', 1)::uuid, auth.uid())
      )
    );
$$;

-- Ensure vehicle-images write policies use ONLY this function
DROP POLICY IF EXISTS "Vehicle owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Vehicle owners can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Vehicle owners can delete their images" ON storage.objects;

CREATE POLICY "Vehicle owners can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image_path(name)
);

CREATE POLICY "Vehicle owners can update their images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image_path(name)
)
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image_path(name)
);

CREATE POLICY "Vehicle owners can delete their images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image_path(name)
);

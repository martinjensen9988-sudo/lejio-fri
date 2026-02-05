-- Use SECURITY DEFINER function to avoid vehicles table RLS blocking storage policies

CREATE OR REPLACE FUNCTION public.can_manage_vehicle_image_path(object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vehicle_text text;
  vehicle_uuid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Admins/support can manage all
  IF public.has_any_admin_role(auth.uid()) THEN
    RETURN true;
  END IF;

  IF object_name IS NULL OR object_name = '' THEN
    RETURN false;
  END IF;

  vehicle_text := split_part(object_name, '/', 1);
  IF vehicle_text IS NULL OR vehicle_text = '' THEN
    RETURN false;
  END IF;

  BEGIN
    vehicle_uuid := vehicle_text::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;

  RETURN EXISTS (
    SELECT 1
    FROM public.vehicles v
    WHERE v.id = vehicle_uuid
      AND v.owner_id = auth.uid()
  );
END;
$$;

-- Replace vehicle-images write policies to use the function
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

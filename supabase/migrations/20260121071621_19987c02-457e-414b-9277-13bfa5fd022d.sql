-- Fix vehicle-images upload failing due to missing Storage RLS policies

-- 1) Helper function: only vehicle owner can upload/update/delete images under vehicleId/*
CREATE OR REPLACE FUNCTION public.can_manage_vehicle_image(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT CASE
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

-- 2) Storage policies for vehicle-images bucket
-- Note: bucket is public, so allow public reads.
DROP POLICY IF EXISTS "Public can view vehicle images" ON storage.objects;
CREATE POLICY "Public can view vehicle images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Vehicle owners can upload vehicle images" ON storage.objects;
CREATE POLICY "Vehicle owners can upload vehicle images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image(name)
);

DROP POLICY IF EXISTS "Vehicle owners can update vehicle images" ON storage.objects;
CREATE POLICY "Vehicle owners can update vehicle images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image(name)
)
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image(name)
);

DROP POLICY IF EXISTS "Vehicle owners can delete vehicle images" ON storage.objects;
CREATE POLICY "Vehicle owners can delete vehicle images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image(name)
);

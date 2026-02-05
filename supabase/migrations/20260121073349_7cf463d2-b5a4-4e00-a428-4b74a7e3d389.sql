-- Drop duplicate policies and use simpler direct check
DROP POLICY IF EXISTS "Vehicle owners can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Vehicle owners can update vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Vehicle owners can delete vehicle images" ON storage.objects;

-- Fix the existing policies to use split_part instead of storage.foldername
-- Drop old versions first
DROP POLICY IF EXISTS "Vehicle owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Vehicle owners can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Vehicle owners can delete their images" ON storage.objects;

-- Recreate with simpler logic using split_part
CREATE POLICY "Vehicle owners can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id::text = split_part(name, '/', 1)
      AND v.owner_id = auth.uid()
  )
);

CREATE POLICY "Vehicle owners can update their images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id::text = split_part(name, '/', 1)
      AND v.owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id::text = split_part(name, '/', 1)
      AND v.owner_id = auth.uid()
  )
);

CREATE POLICY "Vehicle owners can delete their images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id::text = split_part(name, '/', 1)
      AND v.owner_id = auth.uid()
  )
);
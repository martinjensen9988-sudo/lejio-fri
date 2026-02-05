-- Ensure Storage policies exist for vehicle image uploads
-- Note: storage.objects already has RLS enabled in Supabase-managed schema.

-- Public read (bucket is public but RLS can still block without a SELECT policy)
CREATE POLICY "vehicle_images_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Authenticated users (or admins) can upload images for vehicles they own
CREATE POLICY "vehicle_images_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image_path(name)
);

-- Allow updates (upsert uses INSERT; but UPDATE can happen for metadata)
CREATE POLICY "vehicle_images_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image_path(name)
);

-- Allow deletes
CREATE POLICY "vehicle_images_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vehicle-images'
  AND public.can_manage_vehicle_image_path(name)
);

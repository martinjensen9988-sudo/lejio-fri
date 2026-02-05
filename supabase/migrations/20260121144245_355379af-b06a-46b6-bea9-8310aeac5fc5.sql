-- Allow admins to view all driver license images
CREATE POLICY "Admins can view all driver license images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'driver-licenses' 
  AND has_any_admin_role(auth.uid())
);
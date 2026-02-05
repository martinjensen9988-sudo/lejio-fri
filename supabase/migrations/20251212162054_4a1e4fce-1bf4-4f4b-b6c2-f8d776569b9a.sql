-- Add webhook_secret column to gps_devices table for authentication
ALTER TABLE public.gps_devices ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Fix vehicle-images storage policies - only allow owners to delete/update their own images
-- First drop the overly permissive policies
DROP POLICY IF EXISTS "Users can delete their vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their vehicle images" ON storage.objects;

-- Create proper owner-based DELETE policy
CREATE POLICY "Vehicle owners can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-images' 
  AND EXISTS (
    SELECT 1 FROM public.vehicles v 
    WHERE v.id::text = (storage.foldername(name))[1] 
    AND v.owner_id = auth.uid()
  )
);

-- Create proper owner-based UPDATE policy
CREATE POLICY "Vehicle owners can update their images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-images' 
  AND EXISTS (
    SELECT 1 FROM public.vehicles v 
    WHERE v.id::text = (storage.foldername(name))[1] 
    AND v.owner_id = auth.uid()
  )
);
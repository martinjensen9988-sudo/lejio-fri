-- Add image_url and features columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN image_url text NULL,
ADD COLUMN features text[] NULL DEFAULT '{}';

-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their vehicle images
CREATE POLICY "Users can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to vehicle images
CREATE POLICY "Public can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Allow users to update their own vehicle images
CREATE POLICY "Users can update their vehicle images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own vehicle images
CREATE POLICY "Users can delete their vehicle images"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');
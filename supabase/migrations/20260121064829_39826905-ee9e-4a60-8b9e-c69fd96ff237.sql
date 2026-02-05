-- Add INSERT policy for vehicle-images bucket so vehicle owners can upload images
CREATE POLICY "Vehicle owners can upload vehicle images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' 
  AND auth.uid() IS NOT NULL
);

-- Add UPDATE policy so owners can update/replace their images
CREATE POLICY "Vehicle owners can update vehicle images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'vehicle-images' 
  AND auth.uid() IS NOT NULL
);

-- Add DELETE policy so owners can delete their images
CREATE POLICY "Vehicle owners can delete vehicle images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vehicle-images' 
  AND auth.uid() IS NOT NULL
);
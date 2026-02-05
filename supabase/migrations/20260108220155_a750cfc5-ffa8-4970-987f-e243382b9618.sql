-- Fix 1: Drop and recreate the vehicle-images INSERT policy with ownership validation
DROP POLICY IF EXISTS "Users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their vehicle images" ON storage.objects;

-- Create secure INSERT policy that validates ownership
-- Folder structure: {vehicle_id}/{filename}
CREATE POLICY "Vehicle owners can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id::text = (storage.foldername(name))[1]
    AND v.owner_id = auth.uid()
  )
);

-- Fix 2: Update get_renter_rating_stats to require authentication and validate email
CREATE OR REPLACE FUNCTION public.get_renter_rating_stats(renter_email_input TEXT)
RETURNS TABLE(average_rating NUMERIC, total_ratings INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Validate email format
  IF renter_email_input IS NULL OR renter_email_input = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  IF renter_email_input !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::NUMERIC, 0) as average_rating,
    COUNT(*)::INTEGER as total_ratings
  FROM public.renter_ratings
  WHERE renter_email = renter_email_input;
END;
$$;
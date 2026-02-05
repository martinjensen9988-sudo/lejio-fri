-- Add storage policies for checkinout-images bucket
CREATE POLICY "Authenticated users can upload checkinout images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'checkinout-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view checkinout images"
ON storage.objects FOR SELECT
USING (bucket_id = 'checkinout-images' AND auth.role() = 'authenticated');

-- Make the bucket public for easier access
UPDATE storage.buckets SET public = true WHERE id = 'checkinout-images';

-- Drop and recreate the insert policy for check_in_out_records to be more permissive for lessors
DROP POLICY IF EXISTS "Lessors can insert check-in/out records" ON public.check_in_out_records;
DROP POLICY IF EXISTS "Renters can insert their check-in/out records" ON public.check_in_out_records;

-- Create a single insert policy that allows the authenticated user to insert
-- as long as the lessor_id in the record matches the booking's lessor_id
CREATE POLICY "Users can insert check-in/out records for their bookings"
ON public.check_in_out_records
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_id 
    AND (b.lessor_id = auth.uid() OR b.renter_id = auth.uid())
  )
);
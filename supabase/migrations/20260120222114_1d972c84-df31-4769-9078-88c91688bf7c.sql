-- Add policy to allow renters to view contracts by email match (for cases where renter_id is null)
CREATE POLICY "Renters can view contracts by email"
ON public.contracts FOR SELECT
USING (
  auth.uid() = renter_id 
  OR (
    renter_id IS NULL 
    AND renter_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Drop old renter select policy to avoid conflict
DROP POLICY IF EXISTS "Renters can view their contracts" ON public.contracts;

-- Add policy to allow renters to update signature by email match
CREATE POLICY "Renters can update signature by email"
ON public.contracts FOR UPDATE
USING (
  auth.uid() = renter_id 
  OR (
    renter_id IS NULL 
    AND renter_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Drop old renter update policy
DROP POLICY IF EXISTS "Renters can update their signature" ON public.contracts;

-- Update storage policy for renters to access contracts by email
CREATE POLICY "Renters can read contracts by email"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.pdf_url = name
    AND (
      c.renter_id = auth.uid()
      OR (c.renter_id IS NULL AND c.renter_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  )
);

-- Drop old storage policy if exists
DROP POLICY IF EXISTS "Renters can read their contracts" ON storage.objects;
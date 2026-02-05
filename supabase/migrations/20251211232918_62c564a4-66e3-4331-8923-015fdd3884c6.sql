-- Add RLS policies for contracts storage bucket
-- Allow lessor to upload contracts to their own folder
CREATE POLICY "Lessors can upload contracts to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow lessor to read their own contracts
CREATE POLICY "Lessors can read their own contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow renters to read contracts they are part of
CREATE POLICY "Renters can read their contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.pdf_url = name
    AND c.renter_id = auth.uid()
  )
);

-- Allow lessors to update/overwrite their own contracts
CREATE POLICY "Lessors can update their contracts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contracts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
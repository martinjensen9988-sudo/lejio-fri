-- Drop lessor policies for workshop-invoices bucket
DROP POLICY IF EXISTS "Lessors can upload their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Lessors can view their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Lessors can delete their own invoices" ON storage.objects;

-- Create admin-only policies for workshop-invoices bucket
CREATE POLICY "Admins can upload workshop invoices"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workshop-invoices' 
  AND public.has_any_admin_role(auth.uid())
);

CREATE POLICY "Admins can update workshop invoices"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workshop-invoices' 
  AND public.has_any_admin_role(auth.uid())
);

CREATE POLICY "Admins can delete workshop invoices"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workshop-invoices' 
  AND public.has_any_admin_role(auth.uid())
);
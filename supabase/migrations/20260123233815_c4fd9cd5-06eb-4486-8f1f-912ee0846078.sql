-- Create storage bucket for workshop invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-invoices', 'workshop-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Add invoice_url column to fleet_loan_requests
ALTER TABLE public.fleet_loan_requests 
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS invoice_filename TEXT;

-- RLS policies for workshop-invoices bucket
-- Lessors can upload to their own folder
CREATE POLICY "Lessors can upload their own invoices"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workshop-invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Lessors can view their own invoices
CREATE POLICY "Lessors can view their own invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'workshop-invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all invoices
CREATE POLICY "Admins can view all workshop invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'workshop-invoices' 
  AND public.has_any_admin_role(auth.uid())
);

-- Lessors can delete their own invoices
CREATE POLICY "Lessors can delete their own invoices"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workshop-invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
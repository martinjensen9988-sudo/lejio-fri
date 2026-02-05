-- Create contracts table for storing signed rental contracts
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  renter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contract content
  contract_number TEXT NOT NULL UNIQUE,
  contract_type TEXT NOT NULL DEFAULT 'standard' CHECK (contract_type IN ('standard', 'business')),
  
  -- Vehicle details at time of contract
  vehicle_registration TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER,
  vehicle_vin TEXT,
  vehicle_value DECIMAL(12,2), -- For vanvidskørsel liability
  
  -- Rental terms
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_price DECIMAL(10,2) NOT NULL,
  included_km INTEGER NOT NULL DEFAULT 100,
  extra_km_price DECIMAL(10,2) NOT NULL DEFAULT 2.50,
  total_price DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Lessor details
  lessor_name TEXT NOT NULL,
  lessor_email TEXT NOT NULL,
  lessor_phone TEXT,
  lessor_address TEXT,
  lessor_company_name TEXT,
  lessor_cvr TEXT,
  
  -- Renter details
  renter_name TEXT NOT NULL,
  renter_email TEXT NOT NULL,
  renter_phone TEXT,
  renter_address TEXT,
  renter_license_number TEXT,
  
  -- Insurance details
  insurance_company TEXT,
  insurance_policy_number TEXT,
  deductible_amount DECIMAL(10,2) DEFAULT 5000,
  
  -- Vanvidskørsel clause
  vanvidskørsel_accepted BOOLEAN NOT NULL DEFAULT false,
  vanvidskørsel_liability_amount DECIMAL(12,2), -- Usually full vehicle value
  
  -- Signatures
  lessor_signature TEXT, -- Base64 encoded signature image
  lessor_signed_at TIMESTAMP WITH TIME ZONE,
  renter_signature TEXT, -- Base64 encoded signature image
  renter_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- PDF storage
  pdf_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_renter_signature', 'pending_lessor_signature', 'signed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Lessors can manage their contracts
CREATE POLICY "Lessors can view their contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert contracts"
ON public.contracts FOR INSERT
WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their contracts"
ON public.contracts FOR UPDATE
USING (auth.uid() = lessor_id);

-- Renters can view and sign their contracts
CREATE POLICY "Renters can view their contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = renter_id);

CREATE POLICY "Renters can update their signature"
ON public.contracts FOR UPDATE
USING (auth.uid() = renter_id);

-- Create trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);

-- Storage policies for contracts bucket
CREATE POLICY "Users can view their own contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Lessors can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to generate contract numbers
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.contracts
  WHERE contract_number LIKE year_prefix || '-%';
  
  new_number := year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$;
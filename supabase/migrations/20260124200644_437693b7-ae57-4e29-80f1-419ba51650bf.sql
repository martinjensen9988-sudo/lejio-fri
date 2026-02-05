-- Create table for fleet partner contracts
CREATE TABLE public.fleet_partner_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL UNIQUE,
  
  -- Partner info (from corporate_account)
  partner_company_name TEXT NOT NULL,
  partner_cvr TEXT NOT NULL,
  partner_address TEXT,
  partner_postal_code TEXT,
  partner_city TEXT,
  partner_contact_name TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  partner_phone TEXT,
  
  -- Fleet model selection
  fleet_model TEXT NOT NULL CHECK (fleet_model IN ('partner_starter', 'fleet_basic', 'fleet_premium')),
  commission_rate NUMERIC NOT NULL, -- 15, 25, or 35
  
  -- Vehicle count
  initial_vehicle_count INTEGER NOT NULL DEFAULT 0,
  
  -- Contract dates
  contract_start_date DATE NOT NULL,
  binding_end_date DATE NOT NULL, -- 6 months after start
  
  -- Signatures
  lejio_signer_name TEXT,
  lejio_signer_title TEXT,
  lejio_signature TEXT,
  lejio_signed_at TIMESTAMPTZ,
  
  partner_signer_name TEXT,
  partner_signer_title TEXT,
  partner_signature TEXT,
  partner_signed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_partner_signature', 'pending_lejio_signature', 'signed', 'terminated')),
  
  -- PDF
  pdf_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.fleet_partner_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can access
CREATE POLICY "Admins can view all fleet contracts"
ON public.fleet_partner_contracts
FOR SELECT
USING (has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can create fleet contracts"
ON public.fleet_partner_contracts
FOR INSERT
WITH CHECK (has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can update fleet contracts"
ON public.fleet_partner_contracts
FOR UPDATE
USING (has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can delete fleet contracts"
ON public.fleet_partner_contracts
FOR DELETE
USING (has_any_admin_role(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_fleet_partner_contracts_updated_at
BEFORE UPDATE ON public.fleet_partner_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate fleet contract number
CREATE OR REPLACE FUNCTION public.generate_fleet_contract_number()
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
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(contract_number FROM 'FP-' || year_prefix || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM fleet_partner_contracts
  WHERE contract_number LIKE 'FP-' || year_prefix || '-%';
  
  new_number := 'FP-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Add initial_vehicle_count column to corporate_accounts if not exists
ALTER TABLE public.corporate_accounts 
ADD COLUMN IF NOT EXISTS initial_vehicle_count INTEGER DEFAULT 0;

-- Add fleet_model column to corporate_accounts if not exists
ALTER TABLE public.corporate_accounts 
ADD COLUMN IF NOT EXISTS fleet_model TEXT CHECK (fleet_model IS NULL OR fleet_model IN ('partner_starter', 'fleet_basic', 'fleet_premium'));
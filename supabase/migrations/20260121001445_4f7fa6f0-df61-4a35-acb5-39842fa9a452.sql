-- Add additional renter fields to contracts table for complete rental agreement
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS renter_birth_date date,
ADD COLUMN IF NOT EXISTS renter_license_country text,
ADD COLUMN IF NOT EXISTS renter_license_issue_date date,
ADD COLUMN IF NOT EXISTS renter_city text,
ADD COLUMN IF NOT EXISTS renter_postal_code text,
ADD COLUMN IF NOT EXISTS renter_street_address text,
ADD COLUMN IF NOT EXISTS deductible_insurance_selected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deductible_insurance_price numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.contracts.renter_birth_date IS 'Renter date of birth';
COMMENT ON COLUMN public.contracts.renter_license_country IS 'Country where driver license was issued';
COMMENT ON COLUMN public.contracts.renter_license_issue_date IS 'Date when driver license was issued';
COMMENT ON COLUMN public.contracts.renter_city IS 'Renter city';
COMMENT ON COLUMN public.contracts.renter_postal_code IS 'Renter postal code';
COMMENT ON COLUMN public.contracts.renter_street_address IS 'Renter street address';
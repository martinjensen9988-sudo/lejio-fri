-- Add company logo URL to profiles for professional lessors
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_logo_url text;

-- Add logo URL to contracts to store which logo was used
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS logo_url text;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.company_logo_url IS 'Company logo URL for professional lessors to display on contracts';
COMMENT ON COLUMN public.contracts.logo_url IS 'Logo URL used on this contract (LEJIO for private, company logo for professional)';
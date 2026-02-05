-- Add roadside assistance and fuel policy fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roadside_assistance_provider text,
ADD COLUMN IF NOT EXISTS roadside_assistance_phone text,
ADD COLUMN IF NOT EXISTS fuel_policy_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fuel_missing_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuel_price_per_liter numeric DEFAULT 0;

-- Add roadside assistance and fuel policy fields to contracts
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS roadside_assistance_provider text,
ADD COLUMN IF NOT EXISTS roadside_assistance_phone text,
ADD COLUMN IF NOT EXISTS fuel_policy_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fuel_missing_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuel_price_per_liter numeric DEFAULT 0;
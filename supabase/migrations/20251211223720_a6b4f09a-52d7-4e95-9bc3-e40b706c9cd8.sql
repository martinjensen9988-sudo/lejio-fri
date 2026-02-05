-- Add deposit and prepaid rent fields to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN deposit_required boolean NOT NULL DEFAULT false,
ADD COLUMN deposit_amount numeric DEFAULT 0,
ADD COLUMN prepaid_rent_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN prepaid_rent_months integer DEFAULT 1;
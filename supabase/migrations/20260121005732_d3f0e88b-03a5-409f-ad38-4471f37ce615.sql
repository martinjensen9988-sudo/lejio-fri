-- Add cleaning fee settings to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS exterior_cleaning_fee NUMERIC DEFAULT 350,
ADD COLUMN IF NOT EXISTS interior_cleaning_fee NUMERIC DEFAULT 500;

-- Add constraint for max interior cleaning fee
ALTER TABLE public.vehicles
ADD CONSTRAINT interior_cleaning_fee_max CHECK (interior_cleaning_fee <= 1500);

-- Add cleanliness fields to check_in_out_records
ALTER TABLE public.check_in_out_records
ADD COLUMN IF NOT EXISTS exterior_clean BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS interior_clean BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS exterior_cleaning_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS interior_cleaning_fee NUMERIC DEFAULT 0;

-- Add cleaning fees to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS exterior_cleaning_fee NUMERIC DEFAULT 350,
ADD COLUMN IF NOT EXISTS interior_cleaning_fee NUMERIC DEFAULT 500;

-- Add comment for documentation
COMMENT ON COLUMN public.vehicles.exterior_cleaning_fee IS 'Fee for exterior cleaning if vehicle returned dirty (default 350 kr)';
COMMENT ON COLUMN public.vehicles.interior_cleaning_fee IS 'Fee for interior cleaning if vehicle returned dirty (max 1500 kr)';
COMMENT ON COLUMN public.check_in_out_records.exterior_clean IS 'Whether the exterior was clean at check-in/out';
COMMENT ON COLUMN public.check_in_out_records.interior_clean IS 'Whether the interior was clean at check-in/out';
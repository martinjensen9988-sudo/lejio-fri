-- Add vehicle value verification fields
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS value_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS value_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS value_verified_by uuid,
ADD COLUMN IF NOT EXISTS value_verification_notes text,
ADD COLUMN IF NOT EXISTS value_documentation_requested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS value_documentation_requested_at timestamp with time zone;

-- Add comment explaining the purpose
COMMENT ON COLUMN public.vehicles.value_verified IS 'Whether the vehicle value has been verified by LEJIO admin via spot check';
COMMENT ON COLUMN public.vehicles.value_verified_at IS 'When the vehicle value was verified';
COMMENT ON COLUMN public.vehicles.value_verified_by IS 'Admin user ID who verified the value';
COMMENT ON COLUMN public.vehicles.value_verification_notes IS 'Admin notes from verification process';
COMMENT ON COLUMN public.vehicles.value_documentation_requested IS 'Whether documentation (slutseddel/bank transfer) has been requested';
COMMENT ON COLUMN public.vehicles.value_documentation_requested_at IS 'When documentation was requested';
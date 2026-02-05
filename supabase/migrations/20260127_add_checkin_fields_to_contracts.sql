-- Add check-in PIN code and checked-in timestamp fields to contracts table for QR-based self-service check-ins

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS checkin_pin VARCHAR(6),
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient PIN lookups during check-in
CREATE INDEX IF NOT EXISTS idx_contracts_checkin_pin ON public.contracts(checkin_pin);

-- Add index for tracking checked-in status
CREATE INDEX IF NOT EXISTS idx_contracts_checked_in_at ON public.contracts(checked_in_at);

-- Add comment for documentation
COMMENT ON COLUMN public.contracts.checkin_pin IS 'Random 6-digit PIN code sent to renter for self-service QR-based check-in';
COMMENT ON COLUMN public.contracts.checked_in_at IS 'Timestamp when renter completed check-in via QR code and PIN validation';

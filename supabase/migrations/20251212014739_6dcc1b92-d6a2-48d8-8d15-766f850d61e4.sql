-- Add fuel fee column to bookings for final settlement
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS fuel_fee numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.bookings.fuel_fee IS 'Fuel fee charged at vehicle return based on fuel level difference';
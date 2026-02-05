-- Add payment_method column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.payment_method IS 'Selected payment method: cash, bank_transfer, mobilepay, or card';
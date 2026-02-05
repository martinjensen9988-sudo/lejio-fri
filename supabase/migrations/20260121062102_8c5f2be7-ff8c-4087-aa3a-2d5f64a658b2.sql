-- Add pickup/dropoff times to bookings table (fixing NUMBER -> NUMERIC)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS actual_dropoff_time TIME,
ADD COLUMN IF NOT EXISTS late_return_fee NUMERIC;
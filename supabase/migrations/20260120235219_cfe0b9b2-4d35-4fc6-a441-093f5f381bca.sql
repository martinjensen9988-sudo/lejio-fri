-- Add payment_received column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_received boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_received_at timestamp with time zone;
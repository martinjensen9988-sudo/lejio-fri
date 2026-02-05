-- Add pickup/dropoff time settings to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS default_pickup_time TIME DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS default_dropoff_time TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS late_return_charge_enabled BOOLEAN DEFAULT true;

-- Add pickup/dropoff times to bookings table  
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pickup_time TIME DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS dropoff_time TIME DEFAULT '08:00';

-- Add to contracts table for contract generation
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS pickup_time TIME,
ADD COLUMN IF NOT EXISTS dropoff_time TIME,
ADD COLUMN IF NOT EXISTS late_return_fee_enabled BOOLEAN DEFAULT true;
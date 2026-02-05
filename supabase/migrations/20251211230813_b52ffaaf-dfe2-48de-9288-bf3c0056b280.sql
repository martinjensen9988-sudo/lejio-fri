-- Add driver information columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN renter_first_name text,
ADD COLUMN renter_last_name text,
ADD COLUMN renter_birth_date date,
ADD COLUMN renter_address text,
ADD COLUMN renter_postal_code text,
ADD COLUMN renter_city text,
ADD COLUMN renter_license_number text,
ADD COLUMN renter_license_issue_date date,
ADD COLUMN renter_license_country text DEFAULT 'Danmark';

-- Add extra driver columns
ALTER TABLE public.bookings
ADD COLUMN has_extra_driver boolean DEFAULT false,
ADD COLUMN extra_driver_first_name text,
ADD COLUMN extra_driver_last_name text,
ADD COLUMN extra_driver_birth_date date,
ADD COLUMN extra_driver_license_number text,
ADD COLUMN extra_driver_license_issue_date date,
ADD COLUMN extra_driver_license_country text DEFAULT 'Danmark';
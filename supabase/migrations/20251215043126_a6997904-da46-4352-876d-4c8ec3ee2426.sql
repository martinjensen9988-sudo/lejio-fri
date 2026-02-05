
-- Create check_in_out_records table for storing check-in and check-out data
CREATE TABLE public.check_in_out_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL,
  renter_id UUID,
  record_type TEXT NOT NULL CHECK (record_type IN ('check_in', 'check_out')),
  
  -- License plate verification
  scanned_plate TEXT,
  expected_plate TEXT NOT NULL,
  plate_verified BOOLEAN DEFAULT false,
  plate_scan_image_url TEXT,
  
  -- Dashboard readings
  dashboard_image_url TEXT,
  ai_detected_odometer INTEGER,
  ai_detected_fuel_percent INTEGER,
  confirmed_odometer INTEGER,
  confirmed_fuel_percent INTEGER,
  was_manually_corrected BOOLEAN DEFAULT false,
  manual_correction_reason TEXT,
  requires_review BOOLEAN DEFAULT false,
  
  -- Location verification
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  expected_latitude DOUBLE PRECISION,
  expected_longitude DOUBLE PRECISION,
  location_distance_km DOUBLE PRECISION,
  location_verified BOOLEAN DEFAULT true,
  
  -- Timestamps
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Settlement (only for check_out)
  km_driven INTEGER,
  km_included INTEGER,
  km_overage INTEGER,
  km_overage_rate NUMERIC,
  km_overage_fee NUMERIC DEFAULT 0,
  fuel_start_percent INTEGER,
  fuel_end_percent INTEGER,
  fuel_missing_liters NUMERIC,
  fuel_fee NUMERIC DEFAULT 0,
  total_extra_charges NUMERIC DEFAULT 0,
  settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'calculated', 'approved', 'disputed', 'paid')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add check_in_out_enabled field to profiles for admin toggle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS check_in_out_enabled BOOLEAN DEFAULT false;

-- Create storage bucket for check-in/check-out images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('checkinout-images', 'checkinout-images', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.check_in_out_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for check_in_out_records
CREATE POLICY "Lessors can view their check-in/out records"
  ON public.check_in_out_records
  FOR SELECT
  USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert check-in/out records"
  ON public.check_in_out_records
  FOR INSERT
  WITH CHECK (auth.uid() = lessor_id OR auth.uid() = renter_id);

CREATE POLICY "Lessors can update their check-in/out records"
  ON public.check_in_out_records
  FOR UPDATE
  USING (auth.uid() = lessor_id);

CREATE POLICY "Renters can view their check-in/out records"
  ON public.check_in_out_records
  FOR SELECT
  USING (auth.uid() = renter_id);

CREATE POLICY "Renters can insert their check-in/out records"
  ON public.check_in_out_records
  FOR INSERT
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Super admins can manage all check-in/out records"
  ON public.check_in_out_records
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Storage policies for checkinout-images bucket
CREATE POLICY "Users can upload check-in/out images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'checkinout-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their check-in/out images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'checkinout-images' AND auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_check_in_out_records_updated_at
  BEFORE UPDATE ON public.check_in_out_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_check_in_out_booking ON public.check_in_out_records(booking_id);
CREATE INDEX idx_check_in_out_vehicle ON public.check_in_out_records(vehicle_id);
CREATE INDEX idx_check_in_out_lessor ON public.check_in_out_records(lessor_id);

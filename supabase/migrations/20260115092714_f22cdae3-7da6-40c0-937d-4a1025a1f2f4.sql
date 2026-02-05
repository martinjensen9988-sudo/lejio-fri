-- Create table for vehicle scan sessions (AR damage scans)
CREATE TABLE public.vehicle_scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  check_in_out_record_id UUID REFERENCES public.check_in_out_records(id) ON DELETE SET NULL,
  lessor_id UUID NOT NULL,
  renter_id UUID,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('check_in', 'check_out')),
  total_areas_scanned INTEGER NOT NULL DEFAULT 0,
  total_damages_found INTEGER NOT NULL DEFAULT 0,
  has_severe_damage BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for individual scan area results
CREATE TABLE public.vehicle_scan_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_session_id UUID NOT NULL REFERENCES public.vehicle_scan_sessions(id) ON DELETE CASCADE,
  area_code TEXT NOT NULL,
  area_label TEXT NOT NULL,
  image_url TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for detected damages from AR scanner
CREATE TABLE public.vehicle_scan_damages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_area_id UUID NOT NULL REFERENCES public.vehicle_scan_areas(id) ON DELETE CASCADE,
  scan_session_id UUID NOT NULL REFERENCES public.vehicle_scan_sessions(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  damage_type TEXT NOT NULL,
  description TEXT,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_scan_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_scan_damages ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_scan_sessions
CREATE POLICY "Lessors can view their scan sessions"
  ON public.vehicle_scan_sessions FOR SELECT
  USING (lessor_id = auth.uid() OR renter_id = auth.uid());

CREATE POLICY "Lessors can create scan sessions"
  ON public.vehicle_scan_sessions FOR INSERT
  WITH CHECK (lessor_id = auth.uid() OR renter_id = auth.uid());

CREATE POLICY "Lessors can update their scan sessions"
  ON public.vehicle_scan_sessions FOR UPDATE
  USING (lessor_id = auth.uid() OR renter_id = auth.uid());

-- RLS policies for vehicle_scan_areas
CREATE POLICY "Users can view scan areas they have access to"
  ON public.vehicle_scan_areas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vehicle_scan_sessions s 
    WHERE s.id = scan_session_id 
    AND (s.lessor_id = auth.uid() OR s.renter_id = auth.uid())
  ));

CREATE POLICY "Users can create scan areas for their sessions"
  ON public.vehicle_scan_areas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicle_scan_sessions s 
    WHERE s.id = scan_session_id 
    AND (s.lessor_id = auth.uid() OR s.renter_id = auth.uid())
  ));

-- RLS policies for vehicle_scan_damages
CREATE POLICY "Users can view scan damages they have access to"
  ON public.vehicle_scan_damages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vehicle_scan_sessions s 
    WHERE s.id = scan_session_id 
    AND (s.lessor_id = auth.uid() OR s.renter_id = auth.uid())
  ));

CREATE POLICY "Users can create scan damages for their sessions"
  ON public.vehicle_scan_damages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicle_scan_sessions s 
    WHERE s.id = scan_session_id 
    AND (s.lessor_id = auth.uid() OR s.renter_id = auth.uid())
  ));

-- Create storage bucket for scan images
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-scans', 'vehicle-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vehicle-scans bucket
CREATE POLICY "Anyone can view vehicle scan images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-scans');

CREATE POLICY "Authenticated users can upload vehicle scan images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicle-scans' AND auth.role() = 'authenticated');

-- Add indexes for performance
CREATE INDEX idx_vehicle_scan_sessions_booking ON public.vehicle_scan_sessions(booking_id);
CREATE INDEX idx_vehicle_scan_sessions_vehicle ON public.vehicle_scan_sessions(vehicle_id);
CREATE INDEX idx_vehicle_scan_areas_session ON public.vehicle_scan_areas(scan_session_id);
CREATE INDEX idx_vehicle_scan_damages_session ON public.vehicle_scan_damages(scan_session_id);

-- Trigger for updated_at
CREATE TRIGGER update_vehicle_scan_sessions_updated_at
  BEFORE UPDATE ON public.vehicle_scan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
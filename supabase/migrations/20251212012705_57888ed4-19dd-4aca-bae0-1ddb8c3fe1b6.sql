-- Create damage_reports table
CREATE TABLE public.damage_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('pickup', 'return')),
  odometer_reading INTEGER,
  fuel_level TEXT CHECK (fuel_level IN ('empty', 'quarter', 'half', 'three_quarters', 'full')),
  exterior_clean BOOLEAN DEFAULT true,
  interior_clean BOOLEAN DEFAULT true,
  notes TEXT,
  reported_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create damage_items table for individual damages
CREATE TABLE public.damage_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  damage_report_id UUID NOT NULL REFERENCES public.damage_reports(id) ON DELETE CASCADE,
  position TEXT NOT NULL, -- e.g., 'front-left', 'rear-bumper', 'roof', etc.
  damage_type TEXT NOT NULL, -- e.g., 'scratch', 'dent', 'crack', 'stain'
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for damage_reports
CREATE POLICY "Lessors can view their damage reports"
  ON public.damage_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = damage_reports.booking_id 
    AND b.lessor_id = auth.uid()
  ));

CREATE POLICY "Lessors can insert damage reports"
  ON public.damage_reports FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_id 
    AND b.lessor_id = auth.uid()
  ));

CREATE POLICY "Lessors can update their damage reports"
  ON public.damage_reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = damage_reports.booking_id 
    AND b.lessor_id = auth.uid()
  ));

CREATE POLICY "Renters can view their damage reports"
  ON public.damage_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = damage_reports.booking_id 
    AND b.renter_id = auth.uid()
  ));

-- RLS policies for damage_items
CREATE POLICY "Users can view damage items via report access"
  ON public.damage_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.damage_reports dr
    JOIN public.bookings b ON b.id = dr.booking_id
    WHERE dr.id = damage_items.damage_report_id
    AND (b.lessor_id = auth.uid() OR b.renter_id = auth.uid())
  ));

CREATE POLICY "Lessors can insert damage items"
  ON public.damage_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.damage_reports dr
    JOIN public.bookings b ON b.id = dr.booking_id
    WHERE dr.id = damage_report_id
    AND b.lessor_id = auth.uid()
  ));

CREATE POLICY "Lessors can update damage items"
  ON public.damage_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.damage_reports dr
    JOIN public.bookings b ON b.id = dr.booking_id
    WHERE dr.id = damage_items.damage_report_id
    AND b.lessor_id = auth.uid()
  ));

CREATE POLICY "Lessors can delete damage items"
  ON public.damage_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.damage_reports dr
    JOIN public.bookings b ON b.id = dr.booking_id
    WHERE dr.id = damage_items.damage_report_id
    AND b.lessor_id = auth.uid()
  ));

-- Create storage bucket for damage photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('damage-photos', 'damage-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for damage photos
CREATE POLICY "Anyone can view damage photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'damage-photos');

CREATE POLICY "Authenticated users can upload damage photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'damage-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own damage photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'damage-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own damage photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'damage-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger for updated_at
CREATE TRIGGER update_damage_reports_updated_at
  BEFORE UPDATE ON public.damage_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
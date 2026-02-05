-- Create vehicle_swaps table for tracking vehicle swaps
CREATE TABLE IF NOT EXISTS public.vehicle_swaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  original_vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  new_vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  swap_reason TEXT NOT NULL CHECK (swap_reason IN ('service', 'breakdown', 'damage', 'upgrade')),
  original_odometer INTEGER,
  notes TEXT,
  swapped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicle_service_logs table for service history
CREATE TABLE IF NOT EXISTS public.vehicle_service_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  odometer_reading INTEGER,
  description TEXT,
  cost NUMERIC(10,2),
  performed_by TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tire_management table for storing tire information
CREATE TABLE IF NOT EXISTS public.tire_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  tire_type TEXT NOT NULL CHECK (tire_type IN ('summer', 'winter', 'all_season')),
  brand TEXT,
  model TEXT,
  size TEXT NOT NULL,
  dot_code TEXT,
  purchase_date DATE,
  tread_depth_mm NUMERIC(4,1),
  storage_location TEXT,
  is_mounted BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection_reminders table for MOT/syn reminders
CREATE TABLE IF NOT EXISTS public.inspection_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL DEFAULT 'standard' CHECK (inspection_type IN ('standard', 'first_registration', 'trailer', 'caravan')),
  due_date DATE NOT NULL,
  last_inspection_date DATE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tire_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicle_swaps
CREATE POLICY "Users can view their own vehicle swaps" ON public.vehicle_swaps
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create vehicle swaps" ON public.vehicle_swaps
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- RLS Policies for vehicle_service_logs
CREATE POLICY "Users can view their own service logs" ON public.vehicle_service_logs
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert service logs for their vehicles" ON public.vehicle_service_logs
  FOR INSERT WITH CHECK (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

-- RLS Policies for tire_sets
CREATE POLICY "Users can view their own tire sets" ON public.tire_sets
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage their own tire sets" ON public.tire_sets
  FOR ALL USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

-- RLS Policies for inspection_reminders
CREATE POLICY "Users can view their own inspection reminders" ON public.inspection_reminders
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage their own inspection reminders" ON public.inspection_reminders
  FOR ALL USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE owner_id = auth.uid())
  );

-- Add updated_at trigger for tire_sets
CREATE TRIGGER update_tire_sets_updated_at
  BEFORE UPDATE ON public.tire_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for inspection_reminders
CREATE TRIGGER update_inspection_reminders_updated_at
  BEFORE UPDATE ON public.inspection_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
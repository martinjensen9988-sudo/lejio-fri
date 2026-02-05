-- Create geofences table
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  center_latitude DOUBLE PRECISION NOT NULL,
  center_longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  alert_on_exit BOOLEAN NOT NULL DEFAULT true,
  alert_on_enter BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create geofence alerts table
CREATE TABLE public.geofence_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  geofence_id UUID NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.gps_devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('exit', 'enter')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_geofences_vehicle ON public.geofences(vehicle_id);
CREATE INDEX idx_geofence_alerts_geofence ON public.geofence_alerts(geofence_id);
CREATE INDEX idx_geofence_alerts_unread ON public.geofence_alerts(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_alerts ENABLE ROW LEVEL SECURITY;

-- RLS for geofences
CREATE POLICY "Vehicle owners can manage geofences"
  ON public.geofences FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vehicles WHERE vehicles.id = geofences.vehicle_id AND vehicles.owner_id = auth.uid()
  ));

-- RLS for geofence_alerts
CREATE POLICY "Vehicle owners can view alerts"
  ON public.geofence_alerts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.geofences g
    JOIN public.vehicles v ON v.id = g.vehicle_id
    WHERE g.id = geofence_alerts.geofence_id AND v.owner_id = auth.uid()
  ));

CREATE POLICY "Vehicle owners can update alerts"
  ON public.geofence_alerts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.geofences g
    JOIN public.vehicles v ON v.id = g.vehicle_id
    WHERE g.id = geofence_alerts.geofence_id AND v.owner_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON public.geofences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;
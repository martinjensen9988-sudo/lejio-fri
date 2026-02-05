-- Create GPS devices table to link trackers to vehicles
CREATE TABLE public.gps_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'generic',
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create GPS data points table for location history
CREATE TABLE public.gps_data_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.gps_devices(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  odometer DOUBLE PRECISION,
  ignition_on BOOLEAN,
  fuel_level DOUBLE PRECISION,
  battery_level DOUBLE PRECISION,
  raw_data JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_gps_data_points_device_recorded ON public.gps_data_points(device_id, recorded_at DESC);
CREATE INDEX idx_gps_devices_vehicle ON public.gps_devices(vehicle_id);
CREATE INDEX idx_gps_devices_device_id ON public.gps_devices(device_id);

-- Enable RLS
ALTER TABLE public.gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_data_points ENABLE ROW LEVEL SECURITY;

-- RLS policies for gps_devices
CREATE POLICY "Vehicle owners can view their GPS devices"
  ON public.gps_devices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vehicles WHERE vehicles.id = gps_devices.vehicle_id AND vehicles.owner_id = auth.uid()
  ));

CREATE POLICY "Vehicle owners can manage their GPS devices"
  ON public.gps_devices FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vehicles WHERE vehicles.id = gps_devices.vehicle_id AND vehicles.owner_id = auth.uid()
  ));

-- RLS policies for gps_data_points
CREATE POLICY "Vehicle owners can view GPS data"
  ON public.gps_data_points FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.gps_devices 
    JOIN public.vehicles ON vehicles.id = gps_devices.vehicle_id
    WHERE gps_devices.id = gps_data_points.device_id AND vehicles.owner_id = auth.uid()
  ));

-- Trigger to update updated_at
CREATE TRIGGER update_gps_devices_updated_at
  BEFORE UPDATE ON public.gps_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for GPS data
ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_data_points;
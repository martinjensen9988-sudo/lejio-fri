-- Create vehicles table for lessors
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  year INTEGER,
  fuel_type TEXT,
  color TEXT,
  vin TEXT,
  daily_price DECIMAL(10,2),
  included_km INTEGER DEFAULT 100,
  extra_km_price DECIMAL(10,2) DEFAULT 2.50,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(registration)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  renter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lessor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  renter_name TEXT,
  renter_email TEXT,
  renter_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Vehicles policies: owners can manage their own vehicles
CREATE POLICY "Users can view their own vehicles"
ON public.vehicles FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own vehicles"
ON public.vehicles FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own vehicles"
ON public.vehicles FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own vehicles"
ON public.vehicles FOR DELETE
USING (auth.uid() = owner_id);

-- Public can view available vehicles (for renters to browse)
CREATE POLICY "Anyone can view available vehicles"
ON public.vehicles FOR SELECT
USING (is_available = true);

-- Bookings policies: lessors can manage their bookings
CREATE POLICY "Lessors can view their bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can delete their bookings"
ON public.bookings FOR DELETE
USING (auth.uid() = lessor_id);

-- Renters can view their own bookings
CREATE POLICY "Renters can view their bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = renter_id);

-- Create triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for recurring rental subscriptions
CREATE TABLE public.recurring_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL,
  renter_id UUID,
  renter_email TEXT NOT NULL,
  renter_name TEXT,
  renter_phone TEXT,
  
  -- Rental terms
  monthly_price NUMERIC NOT NULL,
  deposit_amount NUMERIC DEFAULT 0,
  included_km INTEGER DEFAULT 100,
  extra_km_price NUMERIC DEFAULT 2.50,
  
  -- Schedule
  billing_day INTEGER NOT NULL DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 28),
  next_billing_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paused_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Renewal tracking
  total_renewals INTEGER DEFAULT 0,
  last_renewal_at TIMESTAMP WITH TIME ZONE,
  last_renewal_booking_id UUID REFERENCES public.bookings(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_rentals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Lessors can view their recurring rentals"
  ON public.recurring_rentals FOR SELECT
  USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can create recurring rentals"
  ON public.recurring_rentals FOR INSERT
  WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their recurring rentals"
  ON public.recurring_rentals FOR UPDATE
  USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can delete their recurring rentals"
  ON public.recurring_rentals FOR DELETE
  USING (auth.uid() = lessor_id);

CREATE POLICY "Renters can view their recurring rentals"
  ON public.recurring_rentals FOR SELECT
  USING (auth.uid() = renter_id);

CREATE POLICY "Super admins can manage all recurring rentals"
  ON public.recurring_rentals FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_recurring_rentals_updated_at
  BEFORE UPDATE ON public.recurring_rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_recurring_rentals_lessor ON public.recurring_rentals(lessor_id);
CREATE INDEX idx_recurring_rentals_next_billing ON public.recurring_rentals(next_billing_date) WHERE status = 'active';
CREATE INDEX idx_recurring_rentals_vehicle ON public.recurring_rentals(vehicle_id);
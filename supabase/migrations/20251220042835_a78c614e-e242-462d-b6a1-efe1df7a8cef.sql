-- =============================================
-- FAVORITTER: Lejere kan gemme foretrukne køretøjer
-- =============================================
CREATE TABLE public.vehicle_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

ALTER TABLE public.vehicle_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.vehicle_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.vehicle_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON public.vehicle_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- DYNAMISK PRISSÆTNING: Sæsonpriser
-- =============================================
CREATE TABLE public.seasonal_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  fixed_price NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seasonal_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle owners can manage seasonal pricing"
  ON public.seasonal_pricing FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vehicles WHERE id = seasonal_pricing.vehicle_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can view active seasonal pricing"
  ON public.seasonal_pricing FOR SELECT
  USING (is_active = true);

-- =============================================
-- KØREKORT-VERIFIKATION
-- =============================================
CREATE TABLE public.driver_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  license_country TEXT NOT NULL DEFAULT 'Danmark',
  issue_date DATE,
  expiry_date DATE,
  front_image_url TEXT,
  back_image_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  ai_verification_result JSONB,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own licenses"
  ON public.driver_licenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit their licenses"
  ON public.driver_licenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending licenses"
  ON public.driver_licenses FOR UPDATE
  USING (auth.uid() = user_id AND verification_status = 'pending');

CREATE POLICY "Super admins can manage all licenses"
  ON public.driver_licenses FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =============================================
-- KUNDESEGMENTERING: VIP og gentagne lejere
-- =============================================
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lessor_id UUID NOT NULL,
  renter_email TEXT NOT NULL,
  renter_name TEXT,
  segment TEXT NOT NULL DEFAULT 'standard',
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  first_booking_at TIMESTAMP WITH TIME ZONE,
  last_booking_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lessor_id, renter_email)
);

ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessors can view their customer segments"
  ON public.customer_segments FOR SELECT
  USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can manage their customer segments"
  ON public.customer_segments FOR ALL
  USING (auth.uid() = lessor_id);

-- =============================================
-- SERVICE PÅMINDELSER
-- =============================================
CREATE TABLE public.service_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  due_date DATE,
  due_km INTEGER,
  current_km INTEGER,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle owners can manage service reminders"
  ON public.service_reminders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vehicles WHERE id = service_reminders.vehicle_id AND owner_id = auth.uid()
  ));

-- =============================================
-- FAKTURAER
-- =============================================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  lessor_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  renter_email TEXT NOT NULL,
  renter_name TEXT,
  renter_address TEXT,
  renter_cvr TEXT,
  subtotal NUMERIC NOT NULL,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DKK',
  status TEXT NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  line_items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessors can manage their invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = lessor_id);

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number LIKE 'F' || year_prefix || '%';
  
  new_number := 'F' || year_prefix || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$;

-- =============================================
-- DEPOSITUM TRANSAKTIONER
-- =============================================
CREATE TABLE public.deposit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessors can view their deposit transactions"
  ON public.deposit_transactions FOR SELECT
  USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can create deposit transactions"
  ON public.deposit_transactions FOR INSERT
  WITH CHECK (auth.uid() = lessor_id);

-- =============================================
-- Update triggers
-- =============================================
CREATE TRIGGER update_seasonal_pricing_updated_at
  BEFORE UPDATE ON public.seasonal_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_licenses_updated_at
  BEFORE UPDATE ON public.driver_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_reminders_updated_at
  BEFORE UPDATE ON public.service_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Storage bucket for driver licenses
-- =============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('driver-licenses', 'driver-licenses', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own license images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'driver-licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own license images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'driver-licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Super admins can view all license images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'driver-licenses' AND has_role(auth.uid(), 'super_admin'::app_role));
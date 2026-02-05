-- ==========================================
-- 1. FINES/PENALTIES TABLE
-- ==========================================
CREATE TABLE public.fines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lessor_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  renter_email TEXT NOT NULL,
  renter_name TEXT,
  fine_type TEXT NOT NULL DEFAULT 'parking', -- parking, speed, toll, other
  fine_date DATE NOT NULL,
  fine_amount DECIMAL(10,2) NOT NULL,
  admin_fee DECIMAL(10,2) NOT NULL DEFAULT 500,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (fine_amount + admin_fee) STORED,
  file_url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent_to_renter, paid, disputed
  sent_to_renter_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Lessor can manage their own fines
CREATE POLICY "Lessors can view their own fines" ON public.fines
  FOR SELECT USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert fines" ON public.fines
  FOR INSERT WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their own fines" ON public.fines
  FOR UPDATE USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can delete their own fines" ON public.fines
  FOR DELETE USING (auth.uid() = lessor_id);

-- Trigger for updated_at
CREATE TRIGGER update_fines_updated_at
  BEFORE UPDATE ON public.fines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 2. SERVICE BOOKINGS TABLE (for Lejio workshop)
-- ==========================================
CREATE TABLE public.service_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  lessor_id UUID NOT NULL,
  service_reminder_id UUID REFERENCES public.service_reminders(id),
  service_type TEXT NOT NULL, -- oil_change, brakes, tires, inspection, full_service
  preferred_date DATE NOT NULL,
  preferred_time_slot TEXT, -- morning, afternoon, full_day
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  workshop_notes TEXT,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessors can view their service bookings" ON public.service_bookings
  FOR SELECT USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert service bookings" ON public.service_bookings
  FOR INSERT WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their service bookings" ON public.service_bookings
  FOR UPDATE USING (auth.uid() = lessor_id);

CREATE TRIGGER update_service_bookings_updated_at
  BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 3. DEDUCTIBLE INSURANCE PURCHASES
-- ==========================================
CREATE TABLE public.deductible_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) UNIQUE,
  renter_id UUID,
  daily_rate DECIMAL(10,2) NOT NULL DEFAULT 49,
  days_covered INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  original_deductible DECIMAL(10,2) NOT NULL DEFAULT 5000,
  new_deductible DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, claimed, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deductible_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view deductible insurance for their booking" ON public.deductible_insurance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.lessor_id = auth.uid() OR b.renter_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert deductible insurance" ON public.deductible_insurance
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- 4. REFERRAL SYSTEM
-- ==========================================
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_credit_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  available_credit DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral code" ON public.referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- Referral redemptions tracking
CREATE TABLE public.referral_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
  referred_user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  referrer_credit DECIMAL(10,2) NOT NULL DEFAULT 500,
  referred_discount DECIMAL(10,2) NOT NULL DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referral redemptions" ON public.referral_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.referral_codes rc 
      WHERE rc.id = referral_code_id AND rc.user_id = auth.uid()
    )
    OR referred_user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can insert referral redemptions" ON public.referral_redemptions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'LEJIO-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to update referrer credit when redemption is completed
CREATE OR REPLACE FUNCTION public.update_referral_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.referral_codes
    SET 
      total_referrals = total_referrals + 1,
      total_credit_earned = total_credit_earned + NEW.referrer_credit,
      available_credit = available_credit + NEW.referrer_credit,
      updated_at = now()
    WHERE id = NEW.referral_code_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_referral_credit_trigger
  AFTER UPDATE ON public.referral_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_credit();

-- Add admin_fee_setting to profiles for custom fine admin fees
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fine_admin_fee DECIMAL(10,2) DEFAULT 500;

-- Trigger for referral_codes updated_at
CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
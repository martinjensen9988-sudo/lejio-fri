-- Create enum for fleet plan types
CREATE TYPE public.fleet_plan_type AS ENUM ('fleet_basic', 'fleet_premium');

-- Create enum for lessor status levels
CREATE TYPE public.lessor_status AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- Add fleet plan fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN fleet_plan public.fleet_plan_type DEFAULT NULL,
ADD COLUMN fleet_commission_rate numeric DEFAULT NULL,
ADD COLUMN lessor_status public.lessor_status DEFAULT 'bronze',
ADD COLUMN total_rating_sum numeric DEFAULT 0,
ADD COLUMN total_rating_count integer DEFAULT 0,
ADD COLUMN average_rating numeric GENERATED ALWAYS AS (
  CASE WHEN total_rating_count > 0 THEN total_rating_sum / total_rating_count ELSE 0 END
) STORED;

-- Create ratings table for renters rating lessors
CREATE TABLE public.lessor_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  lessor_id uuid NOT NULL,
  renter_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Enable RLS on ratings table
ALTER TABLE public.lessor_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for lessor_ratings
CREATE POLICY "Renters can insert their own ratings"
ON public.lessor_ratings
FOR INSERT
WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can view all ratings"
ON public.lessor_ratings
FOR SELECT
USING (true);

CREATE POLICY "Renters can update their own ratings"
ON public.lessor_ratings
FOR UPDATE
USING (auth.uid() = renter_id);

-- Create function to update lessor rating stats
CREATE OR REPLACE FUNCTION public.update_lessor_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET 
      total_rating_sum = total_rating_sum + NEW.rating,
      total_rating_count = total_rating_count + 1
    WHERE id = NEW.lessor_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET 
      total_rating_sum = total_rating_sum - OLD.rating + NEW.rating
    WHERE id = NEW.lessor_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET 
      total_rating_sum = total_rating_sum - OLD.rating,
      total_rating_count = total_rating_count - 1
    WHERE id = OLD.lessor_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update rating stats
CREATE TRIGGER update_lessor_rating_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.lessor_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_lessor_rating_stats();

-- Create function to update lessor status based on ratings
CREATE OR REPLACE FUNCTION public.update_lessor_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating numeric;
  rating_count integer;
  new_status public.lessor_status;
BEGIN
  -- Get current stats
  SELECT 
    CASE WHEN total_rating_count > 0 THEN total_rating_sum / total_rating_count ELSE 0 END,
    total_rating_count
  INTO avg_rating, rating_count
  FROM public.profiles
  WHERE id = NEW.lessor_id;
  
  -- Determine new status
  -- Platinum: 4.8+ rating, 50+ bookings
  -- Gold: 4.5+ rating, 25+ bookings
  -- Silver: 4.0+ rating, 10+ bookings
  -- Bronze: default
  IF avg_rating >= 4.8 AND rating_count >= 50 THEN
    new_status := 'platinum';
  ELSIF avg_rating >= 4.5 AND rating_count >= 25 THEN
    new_status := 'gold';
  ELSIF avg_rating >= 4.0 AND rating_count >= 10 THEN
    new_status := 'silver';
  ELSE
    new_status := 'bronze';
  END IF;
  
  -- Update status
  UPDATE public.profiles
  SET lessor_status = new_status
  WHERE id = NEW.lessor_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update status after rating changes
CREATE TRIGGER update_lessor_status_trigger
AFTER INSERT OR UPDATE ON public.lessor_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_lessor_status();

-- Create fleet_settlements table for monthly settlements
CREATE TABLE public.fleet_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lessor_id uuid NOT NULL,
  settlement_month date NOT NULL,
  total_revenue numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  net_payout numeric NOT NULL DEFAULT 0,
  bookings_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(lessor_id, settlement_month)
);

-- Enable RLS on fleet_settlements
ALTER TABLE public.fleet_settlements ENABLE ROW LEVEL SECURITY;

-- RLS policies for fleet_settlements
CREATE POLICY "Lessors can view their own settlements"
ON public.fleet_settlements
FOR SELECT
USING (auth.uid() = lessor_id);

CREATE POLICY "Super admins can manage all settlements"
ON public.fleet_settlements
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));
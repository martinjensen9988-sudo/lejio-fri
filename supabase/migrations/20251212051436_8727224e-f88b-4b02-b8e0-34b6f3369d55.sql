-- Create renter_ratings table for lessors to rate renters
CREATE TABLE public.renter_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL,
  renter_id UUID,
  renter_email TEXT NOT NULL,
  renter_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, lessor_id)
);

-- Enable RLS
ALTER TABLE public.renter_ratings ENABLE ROW LEVEL SECURITY;

-- Lessors can insert ratings for their bookings
CREATE POLICY "Lessors can insert renter ratings"
ON public.renter_ratings
FOR INSERT
WITH CHECK (auth.uid() = lessor_id);

-- Lessors can update their own ratings
CREATE POLICY "Lessors can update their ratings"
ON public.renter_ratings
FOR UPDATE
USING (auth.uid() = lessor_id);

-- All authenticated users can view renter ratings (for checking renter reputation)
CREATE POLICY "Authenticated users can view renter ratings"
ON public.renter_ratings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Super admins can manage all ratings
CREATE POLICY "Super admins can manage renter ratings"
ON public.renter_ratings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create function to calculate renter average rating
CREATE OR REPLACE FUNCTION public.get_renter_rating_stats(renter_email_input TEXT)
RETURNS TABLE(average_rating NUMERIC, total_ratings INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::NUMERIC, 0) as average_rating,
    COUNT(*)::INTEGER as total_ratings
  FROM public.renter_ratings
  WHERE renter_email = renter_email_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER update_renter_ratings_updated_at
BEFORE UPDATE ON public.renter_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
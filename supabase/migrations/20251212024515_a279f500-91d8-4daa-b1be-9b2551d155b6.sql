-- Add account status to profiles for admin control
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS account_paused_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS account_paused_reason text,
ADD COLUMN IF NOT EXISTS account_banned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS account_banned_reason text;

-- Create lessor reports table (for renters to report lessors)
CREATE TABLE IF NOT EXISTS public.lessor_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lessor_id uuid NOT NULL,
  reporter_email text NOT NULL,
  reporter_name text,
  reporter_phone text,
  booking_id uuid REFERENCES public.bookings(id),
  reason text NOT NULL,
  description text NOT NULL,
  severity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on lessor_reports
ALTER TABLE public.lessor_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for lessor_reports
CREATE POLICY "Anyone can create lessor report"
ON public.lessor_reports FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can manage lessor reports"
ON public.lessor_reports FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Lessors can view reports about them"
ON public.lessor_reports FOR SELECT
USING (lessor_id = auth.uid());

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lessor_reports_lessor_id ON public.lessor_reports(lessor_id);
CREATE INDEX IF NOT EXISTS idx_lessor_reports_status ON public.lessor_reports(status);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- Create trigger for updated_at
CREATE TRIGGER update_lessor_reports_updated_at
BEFORE UPDATE ON public.lessor_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
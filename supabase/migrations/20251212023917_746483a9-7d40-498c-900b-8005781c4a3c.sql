-- Create enum for warning reasons
CREATE TYPE public.warning_reason AS ENUM (
  'damage',
  'non_payment', 
  'contract_violation',
  'fraud',
  'reckless_driving',
  'late_return',
  'cleanliness',
  'other'
);

-- Create enum for warning/appeal status
CREATE TYPE public.warning_status AS ENUM (
  'active',
  'under_review',
  'dismissed',
  'expired'
);

CREATE TYPE public.appeal_status AS ENUM (
  'pending',
  'reviewing',
  'approved',
  'rejected'
);

-- Renter warnings table
CREATE TABLE public.renter_warnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Renter identification (multiple fields for matching)
  renter_email text NOT NULL,
  renter_phone text,
  renter_license_number text,
  renter_name text,
  
  -- Warning details
  reported_by uuid NOT NULL,
  booking_id uuid REFERENCES public.bookings(id),
  reason public.warning_reason NOT NULL,
  description text NOT NULL,
  severity integer NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  
  -- Financial impact
  damage_amount numeric DEFAULT 0,
  unpaid_amount numeric DEFAULT 0,
  
  -- Status and dates
  status public.warning_status NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 years'),
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Appeals table
CREATE TABLE public.warning_appeals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warning_id uuid NOT NULL REFERENCES public.renter_warnings(id) ON DELETE CASCADE,
  
  -- Appellant info
  appellant_email text NOT NULL,
  appellant_name text,
  
  -- Appeal details
  appeal_reason text NOT NULL,
  supporting_info text,
  
  -- Status
  status public.appeal_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Admin messaging system
CREATE TABLE public.admin_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Related to warning/appeal
  warning_id uuid REFERENCES public.renter_warnings(id) ON DELETE CASCADE,
  appeal_id uuid REFERENCES public.warning_appeals(id) ON DELETE CASCADE,
  
  -- Message details
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'lessor', 'renter')),
  recipient_id uuid,
  recipient_type text CHECK (recipient_type IN ('admin', 'lessor', 'renter')),
  
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.renter_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warning_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for renter_warnings

-- Lessors can create warnings
CREATE POLICY "Lessors can create warnings"
ON public.renter_warnings
FOR INSERT
WITH CHECK (auth.uid() = reported_by);

-- Lessors can view all active warnings (to check renters)
CREATE POLICY "Lessors can view active warnings"
ON public.renter_warnings
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND status = 'active' 
  AND expires_at > now()
);

-- Lessors can view their own reported warnings
CREATE POLICY "Lessors can view own reported warnings"
ON public.renter_warnings
FOR SELECT
USING (auth.uid() = reported_by);

-- Super admins can manage all warnings
CREATE POLICY "Super admins can manage all warnings"
ON public.renter_warnings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for warning_appeals

-- Anyone can create appeal (public access for renters who may not have account)
CREATE POLICY "Anyone can create appeal"
ON public.warning_appeals
FOR INSERT
WITH CHECK (true);

-- Admins can view and manage all appeals
CREATE POLICY "Super admins can manage appeals"
ON public.warning_appeals
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Lessors can view appeals on their warnings
CREATE POLICY "Lessors can view appeals on their warnings"
ON public.warning_appeals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.renter_warnings w
    WHERE w.id = warning_appeals.warning_id
    AND w.reported_by = auth.uid()
  )
);

-- RLS Policies for admin_messages

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages"
ON public.admin_messages
FOR SELECT
USING (
  auth.uid() = sender_id 
  OR auth.uid() = recipient_id
  OR has_role(auth.uid(), 'super_admin')
);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.admin_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Admins can manage all messages
CREATE POLICY "Super admins can manage messages"
ON public.admin_messages
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Create indexes for efficient lookups
CREATE INDEX idx_renter_warnings_email ON public.renter_warnings(renter_email);
CREATE INDEX idx_renter_warnings_license ON public.renter_warnings(renter_license_number);
CREATE INDEX idx_renter_warnings_phone ON public.renter_warnings(renter_phone);
CREATE INDEX idx_renter_warnings_status ON public.renter_warnings(status);
CREATE INDEX idx_renter_warnings_expires ON public.renter_warnings(expires_at);

-- Update trigger for updated_at
CREATE TRIGGER update_renter_warnings_updated_at
BEFORE UPDATE ON public.renter_warnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warning_appeals_updated_at
BEFORE UPDATE ON public.warning_appeals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
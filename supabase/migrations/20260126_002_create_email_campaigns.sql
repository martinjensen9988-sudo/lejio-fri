-- Create email_campaigns table for email marketing
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'archived'
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT email_campaigns_status_check CHECK (status IN ('draft', 'scheduled', 'sent', 'archived'))
);

-- Create email_tracking table for tracking individual email opens/clicks
CREATE TABLE public.email_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  clicked_links TEXT[], -- Array of clicked links
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT email_tracking_status_check CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'))
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- Email campaigns policies
CREATE POLICY "Admins can view email campaigns"
ON public.email_campaigns
FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can create email campaigns"
ON public.email_campaigns
FOR INSERT
WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can update email campaigns"
ON public.email_campaigns
FOR UPDATE
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can delete email campaigns"
ON public.email_campaigns
FOR DELETE
USING (public.has_any_admin_role(auth.uid()));

-- Email tracking policies
CREATE POLICY "Admins can view email tracking"
ON public.email_tracking
FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can insert email tracking"
ON public.email_tracking
FOR INSERT
WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can update email tracking"
ON public.email_tracking
FOR UPDATE
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Service role can manage email tracking"
ON public.email_tracking
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role');

-- Add indexes for performance
CREATE INDEX idx_email_campaigns_created_by ON public.email_campaigns(created_by);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_at ON public.email_campaigns(created_at DESC);
CREATE INDEX idx_email_tracking_campaign_id ON public.email_tracking(campaign_id);
CREATE INDEX idx_email_tracking_lead_id ON public.email_tracking(lead_id);
CREATE INDEX idx_email_tracking_status ON public.email_tracking(status);
CREATE INDEX idx_email_tracking_created_at ON public.email_tracking(created_at DESC);

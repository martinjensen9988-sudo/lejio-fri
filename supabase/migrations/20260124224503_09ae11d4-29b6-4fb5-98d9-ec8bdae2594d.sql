-- Create call logs table for Twilio integration
CREATE TABLE public.crm_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_sid TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_seconds INTEGER,
  from_number TEXT,
  to_number TEXT,
  direction TEXT DEFAULT 'outbound-api',
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_call_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view call logs
CREATE POLICY "Admins can view call logs"
ON public.crm_call_logs
FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

-- Admins can insert call logs
CREATE POLICY "Admins can insert call logs"
ON public.crm_call_logs
FOR INSERT
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Service role can insert call logs (for webhook)
CREATE POLICY "Service role can manage call logs"
ON public.crm_call_logs
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role');

-- Add index for performance
CREATE INDEX idx_crm_call_logs_call_sid ON public.crm_call_logs(call_sid);
CREATE INDEX idx_crm_call_logs_deal_id ON public.crm_call_logs(deal_id);
CREATE INDEX idx_crm_call_logs_created_at ON public.crm_call_logs(created_at DESC);